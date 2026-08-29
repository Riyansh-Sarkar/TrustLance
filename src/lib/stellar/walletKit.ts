"use client";

import type { ISupportedWallet, ModuleInterface } from "@creit.tech/stellar-wallets-kit/types";

export const STELLAR_WALLET_IDS = {
  freighter: "freighter",
  xbull: "xbull",
  albedo: "albedo",
  rabet: "rabet",
  hana: "hana",
  lobstr: "lobstr",
} as const;

export type StellarWalletId = (typeof STELLAR_WALLET_IDS)[keyof typeof STELLAR_WALLET_IDS];

type StellarWalletsKitClass = typeof import("@creit.tech/stellar-wallets-kit/sdk").StellarWalletsKit;

interface StellarWalletKitApi {
  StellarWalletsKit: StellarWalletsKitClass;
}

let kitPromise: Promise<StellarWalletKitApi> | null = null;

export function isSupportedStellarWalletId(id: string): id is StellarWalletId {
  return Object.values(STELLAR_WALLET_IDS).includes(id as StellarWalletId);
}

export async function getStellarWalletKit(): Promise<StellarWalletKitApi> {
  if (!kitPromise) {
    kitPromise = initializeStellarWalletKit();
  }

  return kitPromise;
}

export function normalizeKitWallets(wallets: ISupportedWallet[]) {
  return wallets
    .filter((wallet) => isSupportedStellarWalletId(wallet.id))
    .map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.icon,
      isAvailable: wallet.isAvailable,
      isPlatformWrapper: wallet.isPlatformWrapper,
    }));
}

async function initializeStellarWalletKit(): Promise<StellarWalletKitApi> {
  const [
    sdk,
    types,
    freighter,
    xbull,
    albedo,
    rabet,
    hana,
    lobstr,
  ] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit/sdk"),
    import("@creit.tech/stellar-wallets-kit/types"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
    import("@creit.tech/stellar-wallets-kit/modules/xbull"),
    import("@creit.tech/stellar-wallets-kit/modules/albedo"),
    import("@creit.tech/stellar-wallets-kit/modules/rabet"),
    import("@creit.tech/stellar-wallets-kit/modules/hana"),
    import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
  ]);

  const modules: ModuleInterface[] = [
    new freighter.FreighterModule(),
    new xbull.xBullModule(),
    new albedo.AlbedoModule(),
    new rabet.RabetModule(),
    new hana.HanaModule(),
    new lobstr.LobstrModule(),
  ];

  sdk.StellarWalletsKit.init({
    network: types.Networks.TESTNET,
    modules,
    authModal: {
      hideUnsupportedWallets: false,
      showInstallLabel: true,
    },
  });

  return { StellarWalletsKit: sdk.StellarWalletsKit };
}
