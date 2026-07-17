import { STELLAR_CONFIG } from "@/constants/stellar";

const TESTNET_EXPLORER = "https://stellar.expert/explorer/testnet";
const PUBNET_EXPLORER = "https://stellar.expert/explorer/public";

function getExplorerBase(): string {
  const passphrase = STELLAR_CONFIG.network;

  if (typeof passphrase === "string" && passphrase.includes("Public")) {
    return PUBNET_EXPLORER;
  }
  if (typeof passphrase === "string" && passphrase.includes("Test SDF")) {
    return TESTNET_EXPLORER;
  }
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "PUBLIC"
    ? PUBNET_EXPLORER
    : TESTNET_EXPLORER;
}

export function getTxExplorerUrl(txHash: string): string {
  return `${getExplorerBase()}/tx/${txHash}`;
}

export function getAccountExplorerUrl(publicKey: string): string {
  return `${getExplorerBase()}/account/${publicKey}`;
}

export function getContractExplorerUrl(contractId: string): string {
  return `${getExplorerBase()}/contract/${contractId}`;
}

export function shortenTxHash(txHash: string, head = 6, tail = 4): string {
  if (!txHash) return "";
  if (txHash.length <= head + tail) return txHash;
  return `${txHash.slice(0, head)}…${txHash.slice(-tail)}`;
}
