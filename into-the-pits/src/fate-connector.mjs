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
let onProgress = null; // (message: string) => void — UI hook to show live connect progress

function report(msg) {
  if (typeof onProgress === "function") {
    try { onProgress(msg); } catch { /* ignore */ }
  }
}

// ------------------------------------------------------------------ helpers
function requireWallet() {
  if (!window.ethereum) throw new Error("No wallet found in this browser. Install a wallet and reload.");
}
async function requireConnected() {
  if (!walletClient) await connect();
  return address;
}

async function teller(action, payload = {}) {
  const client = window.sb || window.supabase;
  if (!client?.auth) throw new Error("Supabase client not available — is supabase-js loaded?");
  const { data: session } = await client.auth.getSession();
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

// ------------------------------------------------------------------ chain
// Somnia Testnet params for EIP-3326 wallet_switchEthereumChain / wallet_addEthereumChain.
const CHAIN_ID_HEX = `0x${CHAIN.id.toString(16)}`; // 50312 -> 0xc488
const CHAIN_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: "Somnia Testnet (Shannon)",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: [RPC_HTTP],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"],
};

// Make sure the connected wallet is on the Somnia testnet. Without this every
// on-chain call (buy transfer, SDK loadMarkets currency reads, mint/redeem,
// settle) targets the wrong chain and fails — and the SDK silently drops the
// binary markets whose collateral reads crash. So this must run BEFORE
// loadMarkets().
async function ensureChain() {
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === CHAIN_ID_HEX) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (e) {
    if (e?.code === 4902) {
      // Chain not added to the wallet yet — add it, then switch.
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [CHAIN_PARAMS] });
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
    } else {
      throw new Error(
        `Please switch your wallet to the Somnia Testnet (chain ${CHAIN.id}) and retry. ` +
        `Your wallet is on chain ${Number(current) || current}. (${e?.message ?? e})`,
      );
    }
  }
}

// ------------------------------------------------------------------ connect
async function connect() {
  requireWallet();
  report("Connecting to your wallet…");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  address = accounts[0];
  report("Switching to Somnia Testnet…");
  await ensureChain();
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
  report("Loading markets…");
  await exchange.loadMarkets();
  report("Connected. Verifying wallet…");
  return { address };
}

// -------------------------------------------------------------- wallet bind
// Nonce + personal_sign handshake. Two hard requirements from the Teller:
//  1. the nonce travels in the link payload (a hex signature carries no text)
//  2. the signed text must be EXACTLY the Teller's SIGNING_MESSAGE format —
//     otherwise the recovered signer won't match the address.
async function bind() {
  await requireConnected();
  report("Preparing verification…");
  const { nonce } = await teller("nonce");
  if (!nonce) throw new Error("Teller did not issue a nonce.");
  const message = `FATE: bind wallet to your wallet\nnonce:${nonce}`;
  report("Waiting for your signature…");
  const signature = await walletClient.signMessage({ account: address, message });
  report("Verifying your wallet…");
  return teller("link", { address, signature, nonce: String(nonce ?? ""), signedMessage: message });
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
  const now = Math.floor(Date.now() / 1000);
  // Discover markets via the indexer DIRECTLY (not the SDK's hydrated
  // `exchange.symbols`, which does not surface binary markets even on the
  // correct chain). GraphQL rows are the same data `getBinaryMarkets` used to
  // show — PIT-verified live BINARY markets with future expiry.
  const query = `query { Market(
      where: {
        marketType: { _eq: "BINARY" },
        voided: { _eq: false },
        winningOutcome: { _is_null: true },
        expiry: { _gt: ${now + 30} }
      },
      limit: 20,
      order_by: { expiry: asc }
    ) {
      marketId
      question
      marketAddress
      expiry
      lastPrice
      quoteDecimals
    }
  }`;
  let rows;
  try {
    const res = await fetch(INDEXER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const body = await res.json();
    rows = body?.data?.Market ?? [];
  } catch (e) {
    throw new Error(`DreamDEX indexer unreachable: ${e?.message ?? e}`);
  }
  if (!rows.length) {
    throw new Error(
      "No active binary markets on DreamDEX right now (indexer reached, returned 0 open/unresolved/future markets). " +
      "This is genuinely market availability, not a wallet or connection problem.",
    );
  }
  const m = rows[0];
  // YES odds (probability 0-1) from the last fill price: raw ≈ probability × 10^decimals.
  // Null until the first fill — fall back to 0.5 (even odds) for untraded markets.
  let odds = 0.5;
  if (m.lastPrice != null) {
    const raw = Number(m.lastPrice);
    const dec = Number(m.quoteDecimals) || 6;
    if (raw > 0) odds = Math.min(0.99, Math.max(0.01, raw / 10 ** dec));
  }
  return {
    marketId: m.marketId,
    question: m.question,
    asset: (m.asset ?? ""),
    expiry: Number(m.expiry),
    expiryMs: Number(m.expiry) * 1000,
    odds, // YES-side probability; NO odds = 1 - odds
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
  configure,
  setProgress(cb) { onProgress = cb; },
  connect, bind, state,
  buyFate, cashOutFate, stakeFate, settleStake,
  checkResolution, cancelEscrow, listEscrows, findActiveMarket,
  getBinaryMarkets, getMarket, getMarketOutcome,
  mintBinarySet, redeemWinning, tUSDCBalance,
  get address() { return address; },
  close,
};

// Expose the connector on window so the game page (index.html) can reach it.
window.FateConnector = FateConnector;
