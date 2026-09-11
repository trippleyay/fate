// ============================================================================
//  FATE TELLER — Supabase Edge Function (Deno)
//  The ONLY writer of fate_ledger / fate_events / fate_wallet_links /
//  fate_fight_escrow. Runs under the service role; clients talk to it over
//  HTTP with their Supabase JWT (anonymous auth) in the Authorization header.
//
//  Actions (POST JSON { action, ... }):
//    nonce                                   -> { nonce }
//    link   { address, signature }           -> { wallet }   (binds sub->wallet)
//    state                                   -> { wallet, fate, cashable, events }
//    buy    { txHash }                       -> { fate, balance }
//    cashout{ fateAmount }                   -> { fate, txHash }
//    stake  { fateAmount, kind, side, marketId } -> { escrowId, fate }
//    settle { escrowId, won, payoutFate }    -> { fate, payout }
//
//  Env (supabase secrets set ...):
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (injected automatically)
//    TELLER_PRIVATE_KEY   (Teller hot wallet; holds the tUSDC reserve)
//    TELLER_NONCE_SECRET  (random string for HMAC nonces)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPublicClient, createWalletClient, http, erc20Abi, verifyMessage } from "https://esm.sh/viem@2";
import { privateKeyToAccount } from "https://esm.sh/viem@2/accounts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const RPC_URL = Deno.env.get("SOMNIA_RPC_URL") ?? "https://dream-rpc.somnia.network";
const TUSDC = (Deno.env.get("TUSDC_ADDRESS") ?? "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E") as `0x${string}`;
const FATE_PER_TUSDC = BigInt(Deno.env.get("FATE_PER_TUSDC") ?? "100");
const DAILY_CASHOUT_FATE = BigInt(Deno.env.get("DAILY_CASHOUT_FATE") ?? "10000");
const TUSDC_DECIMALS = 6;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const teller = createWalletClient({
  account: privateKeyToAccount(Deno.env.get("TELLER_PRIVATE_KEY")! as `0x${string}`),
  transport: http(RPC_URL),
});
const publicClient = createPublicClient({ transport: http(RPC_URL) });

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function fail(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// Native HMAC-SHA256 via Web Crypto (no external deps — fixes --use-api bundling)
async function hmacSha256(secret: string, msg: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return new Uint8Array(sig);
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Stateless nonce: HMAC(secret, sub|expiry|rand), 30 min TTL
async function makeNonce(sub: string): Promise<string> {
  const exp = Date.now() + 30 * 60 * 1000;
  const rnd = crypto.randomUUID();
  const sig = hexEncode(await hmacSha256(Deno.env.get("TELLER_NONCE_SECRET")!, `${sub}|${exp}|${rnd}`));
  return `${exp}|${rnd}|${sig}`;
}

async function nonceValid(sub: string, nonce: string): Promise<boolean> {
  const parts = nonce.split("|");
  if (parts.length !== 3) return false;
  const [expStr, rnd, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return false;
  const expected = hexEncode(await hmacSha256(Deno.env.get("TELLER_NONCE_SECRET")!, `${sub}|${exp}|${rnd}`));
  return sig === expected;
}

async function authSub(req: Request): Promise<string> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("missing authorization header");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("invalid token");
  return data.user.id;
}

async function boundWallet(sub: string): Promise<string> {
  const { data, error } = await admin.from("fate_wallet_links").select("wallet_address").eq("sub", sub).maybeSingle();
  if (error || !data) throw new Error("wallet not linked");
  return data.wallet_address;
}

async function getLedger(wallet: string) {
  const { data, error } = await admin.from("fate_ledger").select("*").eq("wallet_address", wallet).maybeSingle();
  if (error) throw new Error("ledger read failed");
  if (data) return data;
  const { data: created, error: insErr } = await admin.from("fate_ledger").insert({ wallet_address: wallet }).select().single();
  if (insErr) throw new Error("ledger create failed");
  return created;
}

async function credit(wallet: string, kind: string, amountFate: bigint, txHash?: string, sponsor?: string, meta?: Record<string, unknown>) {
  const ledger = await getLedger(wallet);
  const fate = BigInt(ledger.fate_balance) + amountFate;
  const bought = BigInt(ledger.total_bought);
  const cashed = BigInt(ledger.total_cashout);
  if (kind === "buy") await admin.from("fate_ledger").update({ fate_balance: Number(fate), total_bought: Number(bought + amountFate) }).eq("wallet_address", wallet);
  else if (kind === "cashout") await admin.from("fate_ledger").update({ fate_balance: Number(fate), total_cashout: Number(cashed + (-amountFate)) }).eq("wallet_address", wallet);
  else await admin.from("fate_ledger").update({ fate_balance: Number(fate) }).eq("wallet_address", wallet);

  await admin.from("fate_events").insert({
    wallet_address: wallet,
    kind,
    amount_fate: Number(amountFate),
    tx_hash: txHash ?? null,
    sponsor: sponsor ?? null,
    meta: meta ?? null,
  });
}

const SIGNING_MESSAGE = (nonce: string) => `FATE: bind wallet to your account\nnonce:${nonce}`;

// ---------------------------------------------------------------------------
// DreamDEX indexer (market resolution — the source of truth for outcomes)
// ---------------------------------------------------------------------------
const INDEXER_URL = Deno.env.get("DREAMDEX_INDEXER_URL") ?? "https://dev.smk.somnia.host/v1/graphql";

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`indexer ${res.status}`);
  const body = await res.json();
  if (body.errors) throw new Error(body.errors[0]?.message ?? "indexer error");
  return body.data as T;
}

const MARKET_BY_ID = `
  query MarketByMarketId($id: String!) {
    Market(where: { marketId: { _eq: $id } }, limit: 1) {
      id marketId marketType question asset status: clobStatus
      expiry winningOutcome voided resolvedAtTimestamp
    }
  }`;

interface MarketRow {
  id: string; marketId: string; marketType: string; question: string | null;
  asset: string | null; status: string | null; expiry: string | number | null;
  winningOutcome: number | null; voided: boolean | null; resolvedAtTimestamp: string | null;
}

async function fetchMarket(marketId: string): Promise<MarketRow | null> {
  const data = await gql<{ Market: MarketRow[] }>(MARKET_BY_ID, { id: marketId });
  return data.Market[0] ?? null;
}

// Determines the outcome for an escrow from the REAL market row.
// Returns {state:"pending"} | {state:"voided"} | {state:"resolved", won}.
async function marketOutcomeFor(marketId: string, side: string): Promise<
  { state: "pending" } | { state: "voided" } | { state: "resolved"; won: boolean; market: MarketRow }
> {
  const m = await fetchMarket(marketId);
  if (!m) return { state: "pending" }; // indexer lag — treat as unresolved
  if (m.voided) return { state: "voided" };
  if (m.winningOutcome == null) return { state: "pending" };
  const won = (m.winningOutcome === 0 && side === "YES") || (m.winningOutcome === 1 && side === "NO");
  return { state: "resolved", won, market: m };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
async function route(req: Request): Promise<Response> {
  const { action, address, signature, nonce, signedMessage, txHash, fateAmount, kind, side, marketId, marketExpiresAt, meta, escrowId, won, payoutFate } = await req.json();
  const sub = await authSub(req);

  // ------------------------------------------------------------------ nonce
  if (action === "nonce") return json({ nonce: await makeNonce(sub) });

  // ------------------------------------------------------------------- link
  // Binds sub -> wallet. The client sends the nonce EXPLICITLY (a hex EIP-191
  // signature never contains readable text, so extracting it from the
  // signature was impossible); the nonce text may alternatively arrive inside
  // the signed message. Verification reconstructs SIGNING_MESSAGE(nonce) and
  // recovers the signer, so the wallet must have signed EXACTLY that text.
  if (action === "link") {
    if (!address || !signature) return fail("address and signature required");
    const extracted = (typeof nonce === "string" && nonce.trim())
      ? nonce.trim()
      : (typeof signedMessage === "string" && signedMessage.includes("nonce:"))
        ? signedMessage.split("nonce:")[1].trim()
        : "";
    if (!extracted) {
      return fail(
        `no nonce in link payload — received nonce=${JSON.stringify(nonce ?? null)}, ` +
        `signedMessage=${JSON.stringify(typeof signedMessage === "string" ? signedMessage.slice(0, 80) : signedMessage ?? null)}`,
      );
    }
    if (!(await nonceValid(sub, extracted))) return fail("nonce expired or invalid");
    const recovered = await verifyMessage({ address, message: SIGNING_MESSAGE(extracted), signature });
    if (!recovered) return fail("signature does not match address", 401);
    const wallet = address.toLowerCase();
    // Allow re-binding: if the wallet is bound to another account (e.g. user cleared
    // cache and got a new anonymous account), transfer the binding to the new account.
    // The FATE ledger is keyed by wallet_address, so the balance follows the wallet.
    await admin.from("fate_wallet_links").upsert({ sub, wallet_address: wallet }, { onConflict: "wallet_address" });
    await getLedger(wallet);
    return json({ wallet });
  }

  // ------------------------------------------------------------------ state
  if (action === "state") {
    const wallet = await boundWallet(sub);
    const ledger = await getLedger(wallet);
    const cashable = BigInt(ledger.total_bought) - BigInt(ledger.total_cashout);
    const { data: events } = await admin.from("fate_events").select("*").eq("wallet_address", wallet).order("created_at", { ascending: false }).limit(20);
    return json({ wallet, fate: Number(ledger.fate_balance), cashable: Number(cashable), events: events ?? [] });
  }

  // ------------------------------------------------------------------- info
  // Returns public Teller config the client needs before it can build a
  // buy/cashout tx (the Teller wallet address it must transfer tUSDC to).
  if (action === "info") {
    return json({ teller: teller.account.address });
  }

  // -------------------------------------------------------------------- buy

  if (action === "buy") {
    if (!txHash) return fail("txHash required");
    const wallet = await boundWallet(sub);
    const { data: dup } = await admin.from("fate_events").select("id").eq("wallet_address", wallet).eq("kind", "buy").eq("tx_hash", txHash).maybeSingle();
    if (dup) return fail("tx already claimed", 409);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
    if (receipt.status !== "success") return fail("tx failed on-chain");
    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const tellerAddr = teller.account.address.toLowerCase().slice(2).padStart(64, "0");
    const walletTopic = wallet.toLowerCase().slice(2).padStart(64, "0");

    let amountRaw = 0n;
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === TUSDC.toLowerCase() &&
        log.topics[0] === transferTopic &&
        log.topics[1]?.slice(2) === walletTopic &&
        log.topics[2]?.slice(2) === tellerAddr
      ) {
        amountRaw += BigInt(log.data);
      }
    }
    if (amountRaw <= 0n) return fail("no matching tUSDC transfer found in tx");

    const fateAmount = (amountRaw * FATE_PER_TUSDC) / BigInt(10 ** TUSDC_DECIMALS);
    await credit(wallet, "buy", fateAmount, txHash);
    const ledger = await getLedger(wallet);
    return json({ fate: Number(fateAmount), balance: Number(ledger.fate_balance) });
  }

  // ---------------------------------------------------------------- cashout
  if (action === "cashout") {
    if (!fateAmount || fateAmount <= 0) return fail("fateAmount required");
    const wallet = await boundWallet(sub);
    const ledger = await getLedger(wallet);
    const amount = BigInt(fateAmount);
    if (amount > BigInt(ledger.fate_balance)) return fail("insufficient fate");

    const today = new Date().toISOString().slice(0, 10);
    const { data: quota } = await admin.from("fate_quotas").select("*").eq("wallet_address", wallet).eq("day", today).maybeSingle();
    const cashedToday = BigInt(quota?.total_cashout ?? 0);
    if (cashedToday + amount > DAILY_CASHOUT_FATE) return fail("daily cashout limit reached");

    // Debit first (server-authoritative), then send on-chain
    await credit(wallet, "cashout", -amount);
    const tusdcOut = (amount * BigInt(10 ** TUSDC_DECIMALS)) / FATE_PER_TUSDC;
    try {
      // Fetch nonce explicitly from chain to avoid "nonce too low" when the
      // wallet client's in-memory nonce gets out of sync.
      const nonce = await publicClient.getTransactionCount({ address: teller.account.address });
      const hash = await teller.writeContract({
        address: TUSDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [wallet as `0x${string}`, tusdcOut],
        nonce,
      });
      await admin.from("fate_quotas").upsert({ wallet_address: wallet, day: today, total_cashout: Number(cashedToday + amount) }, { onConflict: "wallet_address,day" });
      return json({ fate: Number((await getLedger(wallet)).fate_balance), txHash: hash });
    } catch (e: any) {
      await credit(wallet, "cashout_refund", amount, null, null, { reason: e?.message ?? "send failed" });
      return fail("chain transfer failed, refunded: " + String(e?.message ?? e));
    }
  }

  // ------------------------------------------------------------------ stake
  if (action === "stake") {
    if (!fateAmount || fateAmount <= 0) return fail("fateAmount required");
    if (!['fight_stake', 'side_bet'].includes(kind)) return fail("kind must be fight_stake or side_bet");
    if (!["YES", "NO"].includes(side)) return fail("side must be YES or NO");
    const wallet = await boundWallet(sub);
    const ledger = await getLedger(wallet);
    const amount = BigInt(fateAmount);
    if (amount > BigInt(ledger.fate_balance)) return fail("insufficient fate");

    await credit(wallet, kind, -amount, null, null, { side, marketId: marketId ?? null });
    const { data: escrow, error } = await admin.from("fate_fight_escrow").insert({
      wallet_address: wallet, market_id: marketId ?? null,
      stake_fate: Number(amount), side, kind,
      market_expires_at: marketExpiresAt ? new Date(marketExpiresAt).toISOString() : null,
      meta: meta ?? null,
    }).select("id").single();
    if (error) {
      await credit(wallet, "sponsor_reward", amount, null, null, { reason: "escrow insert failed, refunded" });
      return fail("escrow insert failed, stake refunded");
    }
    return json({ escrowId: escrow.id, fate: Number((await getLedger(wallet)).fate_balance) });
  }

  // ----------------------------------------------------------------- settle
  // OUTCOME IS NEVER TAKEN FROM THE CLIENT. The Teller reads the pinned
  // DreamDEX market's on-chain resolution and settles accordingly. `won` /
  // `payoutFate` in the request body are ignored entirely.
  if (action === "settle") {
    const wallet = await boundWallet(sub);
    const { data: row } = await admin.from("fate_fight_escrow")
      .select("*").eq("id", escrowId).eq("wallet_address", wallet).maybeSingle();
    if (!row) return fail("escrow not found", 404);
    if (row.status !== "locked") return fail("escrow already settled", 409);
    if (!row.market_id) return fail("escrow has no pinned market (legacy escrow)");

    const outcome = await marketOutcomeFor(row.market_id, row.side);
    if (outcome.state === "pending") return fail("market not resolved yet", 409);
    if (outcome.state === "voided") {
      await admin.from("fate_fight_escrow").update({
        status: "voided", market_voided: true, settled_at: new Date().toISOString(),
      }).eq("id", escrowId);
      return json({ voided: true, escrowId });
    }

    const stake = BigInt(row.stake_fate);
    // Odds-based payout: capture the market odds at BET time (stored in escrow
    // meta by the client). Payout = floor(stake / odds) — e.g. 100 FATE at 0.5
    // odds → 200; at 0.8 → 125; at 0.25 → 400. Bets escrowed before this
    // change have no entryOdds and fall back to the old flat 2x.
    let odds = 0.5;
    const storedOdds = Number(row.meta?.entryOdds);
    if (storedOdds > 0 && storedOdds < 1) odds = storedOdds;
    let payout: bigint;
    if (!outcome.won) {
      payout = 0n;
    } else {
      payout = (stake * 1000n) / BigInt(Math.round(odds * 1000));
      if (payout <= stake) payout = stake + 1n; // a win must always profit
    }
    await admin.from("fate_fight_escrow").update({
      status: outcome.won ? "won" : "lost", payout_fate: Number(payout),
      settled_at: new Date().toISOString(),
    }).eq("id", escrowId);
    if (payout > 0n) await credit(wallet, "sponsor_reward", payout, null, null, { escrowId, kind: row.kind });
    return json({
      escrowId, won: outcome.won, voided: false, payout: Number(payout),
      entryOdds: odds,
      fate: Number((await getLedger(wallet)).fate_balance),
      market: {
        marketId: outcome.market.marketId, question: outcome.market.question,
        winningOutcome: outcome.market.winningOutcome, side: row.side,
        resolvedAt: outcome.market.resolvedAtTimestamp,
      },
    });
  }

  // ------------------------------------------------------- checkResolution
  // Poll endpoint for the Pending Matches screen. Read-only: reports whether
  // the pinned market has resolved / voided and the real winning side.
  if (action === "checkResolution") {
    const wallet = await boundWallet(sub);
    const { data: row } = await admin.from("fate_fight_escrow")
      .select("id, market_id, side, status, stake_fate, meta, market_expires_at")
      .eq("id", escrowId).eq("wallet_address", wallet).maybeSingle();
    if (!row) return fail("escrow not found", 404);
    if (row.status !== "locked") return json({ settled: true, status: row.status });
    if (!row.market_id) return json({ settled: false, pending: true, noMarket: true });
    const outcome = await marketOutcomeFor(row.market_id, row.side);
    if (outcome.state === "pending") {
      return json({ settled: false, pending: true, expiresAt: row.market_expires_at, meta: row.meta });
    }
    if (outcome.state === "voided") {
      return json({ settled: false, pending: false, voided: true, meta: row.meta });
    }
    return json({
      settled: false, pending: false, resolved: true, won: outcome.won,
      market: {
        marketId: outcome.market.marketId, question: outcome.market.question,
        asset: outcome.market.asset, winningOutcome: outcome.market.winningOutcome,
        side: row.side, resolvedAt: outcome.market.resolvedAtTimestamp,
      },
      meta: row.meta,
    });
  }

  // ------------------------------------------------------------ cancelEscrow
  // Only voided escrows can be cancelled: refunds the locked stake.
  if (action === "cancelEscrow") {
    const wallet = await boundWallet(sub);
    const { data: row } = await admin.from("fate_fight_escrow")
      .select("*").eq("id", escrowId).eq("wallet_address", wallet).maybeSingle();
    if (!row) return fail("escrow not found", 404);
    if (row.status !== "locked") return fail("escrow already settled", 409);
    if (!row.market_id) return fail("escrow has no pinned market");
    // Re-verify against the indexer: no refund unless the market truly voided.
    const outcome = await marketOutcomeFor(row.market_id, row.side);
    if (outcome.state !== "voided") return fail("market not voided — cannot cancel", 409);
    await admin.from("fate_fight_escrow").update({
      status: "refunded", market_voided: true, settled_at: new Date().toISOString(),
    }).eq("id", escrowId);
    await credit(wallet, "sponsor_reward", BigInt(row.stake_fate), null, null, { escrowId, kind: "voided_refund" });
    return json({ refunded: true, fate: Number((await getLedger(wallet)).fate_balance) });
  }

  // ------------------------------------------------------------- listEscrows
  // The player's escrow history (drives Pending Matches + Market Log even
  // after localStorage is cleared).
  if (action === "listEscrows") {
    const wallet = await boundWallet(sub);
    const { data, error } = await admin.from("fate_fight_escrow")
      .select("id, market_id, side, kind, status, stake_fate, payout_fate, meta, market_expires_at, market_voided, created_at, settled_at")
      .eq("wallet_address", wallet)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return fail("escrow list failed");
    return json({ escrows: data ?? [] });
  }

  return fail("unknown action");
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only", 405);
  try {
    return await route(req);
  } catch (e: any) {
    return fail(String(e?.message ?? e), 401);
  }
});
