import {
  Asset,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { horizonServer } from "@/lib/stellar/client";
import { STELLAR_CONFIG } from "@/constants/stellar";
import { fetchXlmUsdPrice } from "@/lib/prices/xlmPrice";

const BASE_FEE = "100";
const TX_TIMEOUT_SECONDS = 300;
export const DEFAULT_USDC_TRUSTLINE_LIMIT = "1000000000"; // ~1B, conservative testnet default

interface RawPathAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

function mapPathAsset(p: RawPathAsset): Asset | null {
  if (p.asset_type === "native") return Asset.native();
  if (p.asset_code && p.asset_issuer) {
    return new Asset(p.asset_code, p.asset_issuer);
  }
  return null;
}

function assetsEqual(a: Asset, b: Asset): boolean {
  if (a.isNative() && b.isNative()) return true;
  const aTyped = a as Asset & { code?: string; issuer?: string };
  const bTyped = b as Asset & { code?: string; issuer?: string };
  return aTyped.code === bTyped.code && aTyped.issuer === bTyped.issuer;
}

function cleanPath(
  rawPath: RawPathAsset[],
  sendAsset: Asset,
  destAsset: Asset
): Asset[] {
  const out: Asset[] = [];
  const seen: Asset[] = [];
  for (const p of rawPath) {
    const mapped = mapPathAsset(p);
    if (!mapped) continue;
    if (assetsEqual(mapped, sendAsset)) continue;
    if (assetsEqual(mapped, destAsset)) continue;
    if (seen.some((s) => assetsEqual(s, mapped))) continue;
    seen.push(mapped);
    out.push(mapped);
  }
  return out;
}

export type SwapQuoteKind = "send" | "receive";
export type SwapQuoteSource = "horizon" | "reference_rate";

export interface SwapQuote {
  kind: SwapQuoteKind;
  sourceAmount: string;
  destinationAmount: string;
  path: Asset[];
  source?: SwapQuoteSource;
  xlmUsdRate?: number;
  warning?: string;
}

export async function getSwapQuote(params: {
  sourceAsset: Asset;
  destAsset: Asset;
  sourceAmount: string;
  destAmount: string;
  publicKey: string;
  kind: SwapQuoteKind;
  forceHorizon?: boolean;
}): Promise<SwapQuote | null> {
  // On testnet, Horizon often returns garbage 1:1 paths.
  // If we have an AMM configured, prefer the real reference rate (which triggers Soroban swap).
  if (STELLAR_CONFIG.ammContractId && !params.forceHorizon) {
    const refQuote = await buildReferenceQuote({
      sourceAsset: params.sourceAsset,
      sourceAmount: params.sourceAmount,
      destAsset: params.destAsset,
    });
    if (refQuote) return refQuote;
  }

  if (params.kind === "send") {
    const horizonQuote = await tryStrictSend({
      sourceAsset: params.sourceAsset,
      destAsset: params.destAsset,
      sourceAmount: params.sourceAmount,
      publicKey: params.publicKey,
    });
    if (horizonQuote) return horizonQuote;
    
    // If we specifically requested Horizon (fallback) and it found no paths, 
    // don't fall back to the reference rate, because the user specifically wants the orderbook.
    if (params.forceHorizon) return null;
    
    return buildReferenceQuote({
      sourceAsset: params.sourceAsset,
      sourceAmount: params.sourceAmount,
      destAsset: params.destAsset,
    });
  }

  const receiveQuote = await tryStrictReceive({
    sourceAsset: params.sourceAsset,
    destAsset: params.destAsset,
    destAmount: params.destAmount,
    publicKey: params.publicKey,
  });
  if (receiveQuote) return receiveQuote;
  
  if (params.forceHorizon) return null;

  return buildReferenceQuote({
    sourceAsset: params.sourceAsset,
    sourceAmount: params.sourceAmount,
    destAsset: params.destAsset,
  });
}

function getAssetCode(asset: Asset): string {
  if (asset.isNative()) return "XLM";
  return (asset as Asset & { code?: string }).code ?? "";
}

function isUsdcAsset(asset: Asset): boolean {
  const code = getAssetCode(asset).toUpperCase();
  if (code !== STELLAR_CONFIG.usdc.code.toUpperCase()) return false;
  if (asset.isNative()) return false;
  const issuer = (asset as Asset & { issuer?: string }).issuer;
  if (!issuer) return false;
  return issuer === STELLAR_CONFIG.usdc.issuer;
}

async function buildReferenceQuote(params: {
  sourceAsset: Asset;
  sourceAmount: string;
  destAsset: Asset;
}): Promise<SwapQuote | null> {
  const sourceCode = getAssetCode(params.sourceAsset).toUpperCase();
  const destCode = getAssetCode(params.destAsset).toUpperCase();
  const sendNum = Number(params.sourceAmount);
  if (!Number.isFinite(sendNum) || sendNum <= 0) return null;

  const forward = sourceCode === "XLM" && destCode === STELLAR_CONFIG.usdc.code.toUpperCase();
  const reverse = isUsdcAsset(params.sourceAsset) && sourceCode === STELLAR_CONFIG.usdc.code.toUpperCase() && destCode === "XLM";
  if (!forward && !reverse) return null;

  const xlmUsd = await fetchXlmUsdPrice();
  if (!xlmUsd || xlmUsd <= 0) return null;

  let destinationAmount: number;
  if (forward) {
    destinationAmount = sendNum * xlmUsd;
  } else if (reverse) {
    destinationAmount = xlmUsd > 0 ? sendNum / xlmUsd : 0;
  } else {
    return null;
  }

  return {
    kind: "send",
    sourceAmount: sendNum.toFixed(7),
    destinationAmount: destinationAmount.toFixed(7),
    path: [],
    source: "reference_rate",
    xlmUsdRate: xlmUsd,
    warning: "Using live XLM/USD reference rate — no on-chain order book found for this pair.",
  };
}

async function tryStrictSend(params: {
  sourceAsset: Asset;
  destAsset: Asset;
  sourceAmount: string;
  publicKey: string;
}): Promise<SwapQuote | null> {
  try {
    const sendAmount = Number(params.sourceAmount);
    if (!Number.isFinite(sendAmount) || sendAmount <= 0) return null;
    const res = await horizonServer
      .strictSendPaths(params.sourceAsset, params.sourceAmount, params.publicKey)
      .call();
    const records = (res as { records?: Array<{ source_amount: string | number; destination_amount: string | number; path: RawPathAsset[] }> }).records;
    const matching = records?.find((r) => {
      const dest = new Asset(
        STELLAR_CONFIG.usdc.code,
        STELLAR_CONFIG.usdc.issuer
      );
      const targetDest = (r as unknown as { destination_asset?: string }).destination_asset;
      if (targetDest && !targetDest.includes(dest.code)) return false;
      return Number(r.destination_amount) > 0;
    });
    if (!matching && (!records || records.length === 0)) return null;

    const best = matching ?? records![0];
    const path = cleanPath(best.path ?? [], params.sourceAsset, params.destAsset);

    return {
      kind: "send",
      sourceAmount: String(best.source_amount),
      destinationAmount: String(best.destination_amount),
      path,
    };
  } catch (err) {
    console.warn("Failed to fetch strict-send swap quote from Horizon:", err);
    return null;
  }
}

async function tryStrictReceive(params: {
  sourceAsset: Asset;
  destAsset: Asset;
  destAmount: string;
  publicKey: string;
}): Promise<SwapQuote | null> {
  try {
    const destAmount = Number(params.destAmount);
    if (!Number.isFinite(destAmount) || destAmount <= 0) return null;
    const builder = horizonServer.strictReceivePaths(
      params.publicKey,
      params.destAsset,
      params.destAmount
    );
    const res = (await (builder as unknown as { call: () => Promise<unknown> }).call()) as {
      records?: Array<{ source_amount: string | number; destination_amount: string | number; path: RawPathAsset[] }>;
    };
    const records = res.records;
    if (!records || records.length === 0) return null;
    const best = records[0];
    const path = cleanPath(best.path ?? [], params.sourceAsset, params.destAsset);

    return {
      kind: "receive",
      sourceAmount: String(best.source_amount),
      destinationAmount: String(best.destination_amount),
      path,
    };
  } catch (err) {
    console.warn("Failed to fetch strict-receive swap quote from Horizon:", err);
    return null;
  }
}

export async function buildSwapTransaction(params: {
  kind: SwapQuoteKind;
  sourceAsset: Asset;
  sourceAmount: string;
  destAsset: Asset;
  destAmount: string;
  destMin?: string;
  publicKey: string;
  path: Asset[];
}): Promise<string> {
  const account = await horizonServer.loadAccount(params.publicKey);

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.network,
  });

  if (params.kind === "send") {
    builder.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: params.sourceAsset,
        sendAmount: params.sourceAmount,
        destination: params.publicKey,
        destAsset: params.destAsset,
        destMin: params.destMin ?? params.destAmount,
        path: params.path,
      })
    );
  } else {
    builder.addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: params.sourceAsset,
        sendMax: params.sourceAmount,
        destination: params.publicKey,
        destAsset: params.destAsset,
        destAmount: params.destAmount,
        path: params.path,
      })
    );
  }

  const tx = builder.setTimeout(TX_TIMEOUT_SECONDS).build();
  return tx.toXDR();
}

export async function hasTrustline(
  params: {
    publicKey: string;
    assetCode: string;
    assetIssuer: string;
  },
  strict = true
): Promise<boolean> {
  try {
    const account = await horizonServer.loadAccount(params.publicKey);
    return account.balances.some((b) => {
      if (b.asset_type === "native") return false;
      const balance = b as { asset_code?: string; asset_issuer?: string };
      if (strict) {
        return balance.asset_code === params.assetCode && balance.asset_issuer === params.assetIssuer;
      }
      return balance.asset_code === params.assetCode;
    });
  } catch (err) {
    console.warn("Failed to load account for trustline check:", err);
    return false;
  }
}

export async function hasAnyUsdcTrustline(publicKey: string): Promise<boolean> {
  return hasTrustline(
    { publicKey, assetCode: STELLAR_CONFIG.usdc.code, assetIssuer: STELLAR_CONFIG.usdc.issuer },
    false
  );
}

export async function buildTrustlineTransaction(params: {
  publicKey: string;
  assetCode: string;
  assetIssuer: string;
  limit?: string;
}): Promise<string> {
  const asset = new Asset(params.assetCode, params.assetIssuer);
  const account = await horizonServer.loadAccount(params.publicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.network,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: params.limit ?? DEFAULT_USDC_TRUSTLINE_LIMIT,
      })
    )
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  return tx.toXDR();
}

// Backwards-compatible aliases for existing callers/tests
export const DEFAULT_USDC_ASSET_CODE = STELLAR_CONFIG.usdc.code;
