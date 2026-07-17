import { Horizon, rpc } from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "@/constants/stellar";

export const horizonServer = new Horizon.Server(STELLAR_CONFIG.horizonUrl, {
  allowHttp: false,
});

export const sorobanServer = new rpc.Server(
  STELLAR_CONFIG.sorobanRpcUrl,
  { allowHttp: false }
);

export interface AccountBalanceResult {
  balance: string;
  error: string | null;
}

export interface UsdcBalanceBreakdown {
  classical: string;
  contract: string;
  total: string;
  assetIssuer: string | null;
  contractId: string | null;
}

function getFirstMatchingUsdcBalance(
  account: { balances: ReadonlyArray<Record<string, unknown>> },
  targetIssuer: string
): { balance: string; issuer: string | null } {
  let exact: { balance: string; issuer: string | null } | null = null;
  let any: { balance: string; issuer: string | null } | null = null;
  for (const b of account.balances) {
    const typed = b as { asset_type?: string; asset_code?: string; asset_issuer?: string; balance?: string };
    if (typed.asset_type !== "credit_alphanum4") continue;
    if (typed.asset_code !== "USDC") continue;
    const balance = typed.balance ?? "0";
    if (any === null) {
      any = { balance, issuer: typed.asset_issuer ?? null };
    }
    if (typed.asset_issuer === targetIssuer && exact === null) {
      exact = { balance, issuer: typed.asset_issuer ?? null };
    }
  }
  return exact ?? any ?? { balance: "0", issuer: null };
}

export async function getAccountBalance(
  publicKey: string,
  assetCode: string = "XLM"
): Promise<AccountBalanceResult> {
  try {
    const account = await horizonServer.loadAccount(publicKey);

    if (assetCode === "XLM") {
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );
      return { balance: xlmBalance?.balance ?? "0", error: null };
    }

    if (assetCode === "USDC") {
      const matched = getFirstMatchingUsdcBalance(
        account as unknown as { balances: ReadonlyArray<Record<string, unknown>> },
        STELLAR_CONFIG.usdc.issuer
      );
      return { balance: matched.balance, error: null };
    }

    const tokenBalance = account.balances.find(
      (b) => {
        if (b.asset_type === "native" || !("asset_code" in b)) return false;
        const bTyped = b as { asset_code: string; asset_issuer?: string };
        return bTyped.asset_code === assetCode;
      }
    );

    const bal = (tokenBalance as { balance?: string } | undefined)?.balance ?? "0";
    return { balance: bal, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load account balance";
    return { balance: "0", error: msg };
  }
}

export async function getUsdcBalanceBreakdown(
  publicKey: string
): Promise<UsdcBalanceBreakdown> {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    const matched = getFirstMatchingUsdcBalance(
      account as unknown as { balances: ReadonlyArray<Record<string, unknown>> },
      STELLAR_CONFIG.usdc.issuer
    );
    const total = Number(matched.balance) || 0;
    return {
      classical: matched.balance,
      contract: "0",
      total: total.toString(),
      assetIssuer: matched.issuer,
      contractId: null,
    };
  } catch (err) {
    console.warn("getUsdcBalanceBreakdown failed:", err);
    return {
      classical: "0",
      contract: "0",
      total: "0",
      assetIssuer: null,
      contractId: null,
    };
  }
}


export interface AccountTrustlineInfo {
  hasUSDCTrustline: boolean;
  hasXLM: boolean;
  xlmBalance: string;
  usdcBalance: string;
  usdcTrustlineRequired: boolean;
}

export async function getAccountTrustlines(
  publicKey: string
): Promise<AccountTrustlineInfo> {
  try {
    const account = await horizonServer.loadAccount(publicKey);

    const xlmBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    // Relaxed USDC trustline check: accept any USDC trustline (not just strict issuer)
    // since Soroban AMM payouts usdethe same underlying asset.
    const usdcBalance = account.balances.find((b) => {
      if (b.asset_type === "native" || !("asset_code" in b)) return false;
      const bTyped = b as { asset_code: string; asset_issuer?: string };
      return bTyped.asset_code === STELLAR_CONFIG.usdc.code;
    });

    const hasUSDCTrustline = !!usdcBalance;
    const xlmBal = xlmBalance?.balance ?? "0";
    const usdcBal = (usdcBalance as { balance?: string } | undefined)?.balance ?? "0";

    return {
      hasUSDCTrustline,
      hasXLM: Number(xlmBal) > 0,
      xlmBalance: xlmBal,
      usdcBalance: usdcBal,
      usdcTrustlineRequired: !hasUSDCTrustline,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load account trustlines";
    console.warn("getAccountTrustlines failed:", msg);
    return {
      hasUSDCTrustline: false,
      hasXLM: false,
      xlmBalance: "0",
      usdcBalance: "0",
      usdcTrustlineRequired: true,
    };
  }
}