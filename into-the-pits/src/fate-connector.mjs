// ============================================================================
//  fate-connector.mjs — browser connector for FATE: Into the Pits
//
//  Bundled by esbuild (package.json `npm run build`) into dist/fate-connector.mjs,
//  which game.html loads as a module. Exposes window.FateConnector.
//
//  Security model:
//   - The player's key NEVER leaves their wallet. We hand the SDK a viem
//     `walletClient` built over `window.ethereum`; all signing happens in the
//     wallet (personal_sign for binding, typed txs for trades).
//   - Fate balances live ONLY in the Supabase Teller ledger (service-role
//     writes). This connector never writes the ledger directly.
//   - tUSDC buys: player transfers tUSDC to the Teller wallet and submits the
//     tx hash; the Teller verifies the transfer on-chain before crediting.
// ============================================================================
import { createWalletClient, createPublicClient, custom, http, formatUnits, erc20Abi } from "viem";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const CHAIN = somniaShannon;
const RPC_HTTP = "https://dream-rpc.somnia.network";
const RPC_WS = "wss://api.infra.testnet.somnia.network/ws";
const INDEXER = "https://dev.smk.somnia.host/v1/graphql";
const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E"; // 6 decimals on Shannon
const TUSDC_DECIMALS = 6;

// Overwritten by game.html at load time:
let CONFIG = { tellerUrl: "", supabaseAnonKey: "" };

let walletClient = null;
let publicClient = null;
let exchange = null;
let address = null;

// ------------------------------------------------------------------ helpers
function requireWallet() {
  if (!window.ethereum) throw new Error("No Ethereum wallet found. Install MetaMask (or any EIP-1193 wallet).");
}
async function requireConnected() {
  if (!walletClient) await connect();
  return address;
}

async function teller(action, payload = {}) {
  const { data: session } = await window.supabase.auth.getSession();
  const jwt = session?.session?.access_token;
  if (!jwt) throw new Error("Not signed in to Supabase — auth session missing.");
  const res = await fetch(CONFIG.tellerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      apikey: CONFIG.supabaseAnonKey,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Teller ${action} failed (${res.status})`);
  return body;
}

// ------------------------------------------------------------------ connect
async function connect() {
  requireWallet();
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  address = accounts[0];
  walletClient = createWalletClient({ account: address, chain: CHAIN, transport: custom(window.ethereum) });
  publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_HTTP) });
  // The player's wallet is the signer; the SDK signs every trade through it.
  exchange = new SomniaMarkets({
    indexerUrl: INDEXER,
    chain: CHAIN,
    wsRpcUrl: RPC_WS,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    walletClient,
  });
  await exchange.loadMarkets();
  return { address };
}

// -------------------------------------------------------------- wallet bind
async function bind() {
  await requireConnected();
  const { nonce } = await teller("nonce");
  const message = `FATE: Into the Pits\nBind wallet to account\nNonce: ${nonce}`;
  const signature = await walletClient.signMessage({ account: address, message });
  return teller("link", { address, signature });
}

// ------------------------------------------------------------------- state
async function state() {
  await requireConnected();
  return teller("state");
}

// ---------------------------------------------------------------------- buy
// Buy `tusdcWhole` tUSDC worth of Fate (100 FATE per tUSDC): transfer tUSDC to
// the Teller wallet, wait for the receipt, then hand the tx hash to the Teller
// to verify + credit.
async function buyFate(tusdcWhole) {
  await requireConnected();
  const info = await teller("info");
  const amount = BigInt(tusdcWhole) * 10n ** BigInt(TUSDC_DECIMALS);
  const hash = await walletClient.writeContract({
    account: address, chain: CHAIN, address: TUSDC, abi: erc20Abi,
    functionName: "transfer", args: [info.teller, amount],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("tUSDC transfer reverted");
  return teller("buy", { txHash: hash });
}

// ------------------------------------------------------------------ cashout
async function cashOutFate(fateAmount) {
  await requireConnected();
  return teller("cashout", { fateAmount: String(fateAmount) });
}

// ------------------------------------------------------------- stake/settle
// Stakes are pinned to a REAL DreamDEX binary market. The market id travels
// with the escrow; the Teller (not this client) reads the resolution and
// decides the settlement. `won` never travels client -> server.
async function stakeFate(fateAmount, kind, side, marketId = null, meta = null, marketExpiresAt = null) {
  await requireConnected();
  return teller("stake", {
    fateAmount: String(fateAmount), kind, side, marketId,
    meta, marketExpiresAt,
  });
}
async function settleStake(escrowId) {
  return teller("settle", { escrowId });
}
async function checkResolution(escrowId) {
  return teller("checkResolution", { escrowId });
}
async function cancelEscrow(escrowId) {
  return teller("cancelEscrow", { escrowId });
}
async function listEscrows() {
  return teller("listEscrows", {});
}

// Soonest-to-resolve ACTIVE binary market. This is the market a new fight /
// side bet gets pinned to. Filters: binary, not voided, not resolved, expiry
// in the future; sorted by soonest expiry.
async function findActiveMarket() {
  await requireConnected();
  const now = Date.now();
  const live = exchange.symbols
    .map((s) => exchange.market(s))
    .filter((m) => m && m.marketType === "BINARY")
    .filter((m) => !m.voided && m.winningOutcome == null)
    .filter((m) => Number(m.expiry) * 1000 > now + 30_000) // still open >= 30s
    .sort((a, b) => a.expiry - b.expiry);
  const m = live[0];
  if (!m) return null;
  return {
    marketId: m.marketId,
    question: m.question,
    asset: m.asset,
    expiry: Number(m.expiry),
    expiryMs: Number(m.expiry) * 1000,
  };
}

// ------------------------------------------------------------ DreamDEX read
// Live binary markets, lightest useful projection for the fight UI.
async function getBinaryMarkets() {
  await requireConnected();
  return exchange.symbols
    .map((s) => exchange.market(s))
    .filter((m) => m && m.marketType === "BINARY")
    .map((m) => ({
      symbol: m.symbol,
      marketId: m.marketId,
      question: m.question,
      asset: m.asset,
      status: m.status,
      expiry: Number(m.expiry),
      strike: m.strike,
      winningOutcome: m.winningOutcome, // 0=YES 1=NO, null until resolved
    }));
}

async function getMarket(symbol) {
  await requireConnected();
  const m = exchange.market(symbol);
  if (!m || m.marketType !== "BINARY") throw new Error(`No binary market "${symbol}"`);
  return m;
}

// Real outcome read: the market's winningOutcome (0=YES, 1=NO) or null if not
// resolved / voided. This is what settles side bets that touch the market.
async function getMarketOutcome(symbol) {
  const m = await getMarket(symbol);
  return { winningOutcome: m.winningOutcome, status: m.status, expiry: Number(m.expiry) };
}

// ----------------------------------------------------------- DreamDEX write
// Mint complete sets: tusdcWhole tUSDC -> tusdcWhole YES + tusdcWhole NO.
async function mintBinarySet(symbol, tusdcWhole) {
  await requireConnected();
  const { hash } = await exchange.mintSet(symbol, Number(tusdcWhole));
  return { hash };
}

// After resolution: redeem the winning side held in the portfolio.
async function redeemWinning(symbol) {
  await requireConnected();
  const m = await getMarket(symbol);
  if (m.winningOutcome == null) throw new Error("Market not resolved yet (or voided).");
  const bal = await exchange.fetchBalance();
  const winningKey = m.winningOutcome === 0 ? `${symbol}#YES` : `${symbol}#NO`;
  const amount = bal[winningKey]?.total ?? 0;
  if (!amount) return { redeemed: 0 };
  const { hash } = await exchange.redeem(symbol, amount);
  return { redeemed: amount, hash };
}

async function tUSDCBalance() {
  await requireConnected();
  const raw = await publicClient.readContract({ address: TUSDC, abi: erc20Abi, functionName: "balanceOf", args: [address] });
  return Number(formatUnits(raw, TUSDC_DECIMALS));
}

// --------------------------------------------------------------------- init
export function configure(partial) {
  CONFIG = { ...CONFIG, ...partial };
}
export async function close() {
  if (exchange) await exchange.close();
}

export const FateConnector = {
  configure, connect, bind, state,
  buyFate, cashOutFate, stakeFate, settleStake,
  checkResolution, cancelEscrow, listEscrows, findActiveMarket,
  getBinaryMarkets, getMarket, getMarketOutcome,
  mintBinarySet, redeemWinning, tUSDCBalance,
  get address() { return address; },
  close,
};
