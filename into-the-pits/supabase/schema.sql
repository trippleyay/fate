-- ============================================================================
--  FATE: Into the Pits — Supabase schema, production-grade
--  Run once in the Supabase SQL editor for this project.
--  NOTE: if you ran the earlier (corrupted) version, first run:
--      drop table if exists fate_events, fate_quotas, fate_ledger,
--        fate_wallet_links, fate_fight_escrow cascade;
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FATE LEDGER — server-authoritative source of the Fate balance.
--    Keyed by the player's Ethereum wallet (lowercased). ONLY the Teller edge
--    function (service role) mutates it; clients have zero policies via RLS.
--    Fate is a ledger unit pegged 100 FATE = 1 tUSDC (6dp raw tUSDC).
-- ---------------------------------------------------------------------------
create table if not exists fate_ledger (
  wallet_address   text primary key,
  fate_balance     bigint not null default 0 check (fate_balance >= 0),
  total_bought     bigint not null default 0,
  total_cashout    bigint not null default 0,
  updated_at       timestamptz not null default now()
);

alter table fate_ledger enable row level security;
-- No policies at all: invisible to anon/authenticated. The Teller uses the
-- service-role key which bypasses RLS.

-- ---------------------------------------------------------------------------
-- 2. FATE EVENTS — append-only audit log of every Fate mutation.
--    Writes only via service role (Teller). No UPDATE/DELETE policies ever.
-- ---------------------------------------------------------------------------
create table if not exists fate_events (
  id             bigint generated always as identity primary key,
  wallet_address text not null,
  kind           text not null check (kind in (
                   'buy',
                   'cashout',
                   'fight_stake',
                   'side_bet',
                   'sponsor_reward'
                 )),
  amount_fate    bigint not null check (amount_fate <> 0),
  amount_tusdc   bigint,
  ref_tx_hash    text,
  meta           jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists fate_events_wallet_idx on fate_events (wallet_address, created_at desc);
alter table fate_events enable row level security;

-- ---------------------------------------------------------------------------
-- 3. FATE QUOTAS — per-day rate limits so one wallet can't drain the Teller
--    reserve (10,000 FATE bought / cashed out per UTC day).
-- ---------------------------------------------------------------------------
create table if not exists fate_quotas (
  wallet_address  text not null,
  day             date not null default (now() at time zone 'utc')::date,
  bought_today    bigint not null default 0,
  cashed_today    bigint not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (wallet_address, day)
);

alter table fate_quotas enable row level security;
-- No policies: service-role only.

-- ---------------------------------------------------------------------------
-- 4. WALLET LINKS — binds the signed-in Supabase user (anonymous auth uid) to
--    a proven Ethereum wallet. The client must personal_sign the Teller-issued
--    nonce with the wallet; the Teller recovers the address and stores it.
--    One wallet can be bound by at most one account and vice versa.
-- ---------------------------------------------------------------------------
create table if not exists fate_wallet_links (
  sub            text primary key,
  wallet_address text not null unique,
  bound_at       timestamptz not null default now()
);

alter table fate_wallet_links enable row level security;
-- No policies: bound through the Teller only.

-- ---------------------------------------------------------------------------
-- 5. FIGHT ESCROW — a locked Fight Night / Side Bet stake. The stake is
--    debited from Fate BEFORE the fight resolves ("lock in"), and settled
--    (credited back + payout) by the Teller after the outcome is proven
--    against the DreamDEX market's winningOutcome (or client-resolved fights).
-- ---------------------------------------------------------------------------
create table if not exists fate_fight_escrow (
  id             uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  market_id      text,
  stake_fate     bigint not null check (stake_fate > 0),
  side           text not null check (side in ('YES','NO')),
  kind           text not null check (kind in ('fight_stake','side_bet')),
  status         text not null default 'locked' check (status in ('locked','won','lost','refunded')),
  payout_fate    bigint not null default 0,
  created_at     timestamptz not null default now(),
  settled_at     timestamptz
);

create index if not exists fate_fight_escrow_wallet_idx on fate_fight_escrow (wallet_address, status);
alter table fate_fight_escrow enable row level security;
-- No policies: the client opens/settles escrow only through the Teller.

-- ---------------------------------------------------------------------------
-- Existing leaderboard: keep its prior policies. Readable by all, writes are
-- already constrained to the owner's own row (auth.uid() = auth_id).
-- ---------------------------------------------------------------------------
grant select on leaderboard to anon, authenticated;

-- No policies: append-only, service-role only.


-- ---------------------------------------------------------------------------
-- 6. MARKET-DECIDED OUTCOMES — fight/side-bet results are pinned to a real
--    DreamDEX binary market. The Teller verifies resolution via the indexer
--    at settle time; the client never declares a winner.
-- ---------------------------------------------------------------------------
alter table fate_fight_escrow
  add column if not exists meta jsonb,
  add column if not exists market_expires_at timestamptz,
  add column if not exists market_voided boolean not null default false;

alter table fate_fight_escrow drop constraint if exists fate_fight_escrow_status_check;
alter table fate_fight_escrow add constraint fate_fight_escrow_status_check
  check (status in ('locked','won','lost','refunded','voided'));
