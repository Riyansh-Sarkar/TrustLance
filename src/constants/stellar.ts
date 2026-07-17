import { Networks, Asset } from "@stellar/stellar-sdk";

export const STELLAR_CONFIG = {
  network: Networks.TESTNET,
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  contractId: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CAC3XR6VYSDMTUNQXIJGOVJEEOO6H5PTFCS5VHPY5X64JAXKIJNBOGLU",
  ammContractId: process.env.NEXT_PUBLIC_AMM_CONTRACT_ID || "",
  usdc: {
    code: "USDC",
    issuer: process.env.NEXT_PUBLIC_USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  usdcContractId: process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || "",
  anchorUrl: process.env.NEXT_PUBLIC_ANCHOR_URL || "https://testanchor.stellar.org",
};

export function getUSDCSACAddress(): string {
  if (STELLAR_CONFIG.usdcContractId) {
    return STELLAR_CONFIG.usdcContractId;
  }
  try {
    const asset = new Asset(STELLAR_CONFIG.usdc.code, STELLAR_CONFIG.usdc.issuer);
    return asset.contractId(STELLAR_CONFIG.network);
  } catch (err) {
    console.warn(
      "Failed to derive USDC SAC address from issuer; set NEXT_PUBLIC_USDC_CONTRACT_ID as fallback.",
      err
    );
    return STELLAR_CONFIG.usdc.issuer;
  }
}

export function getUsdcAsset(): Asset {
  return new Asset(STELLAR_CONFIG.usdc.code, STELLAR_CONFIG.usdc.issuer);
}
