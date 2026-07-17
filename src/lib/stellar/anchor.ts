export interface AnchorFlowResult {
  url: string;
  id: string;
}

export interface AnchorInfo {
  deposit: Record<string, { enabled: boolean }>;
  withdraw: Record<string, { enabled: boolean }>;
  name?: string;
}

function joinUrl(base: string, path: string): string {
  return new URL(path, base).href;
}

export async function getAnchorInfo(anchorUrl: string): Promise<AnchorInfo | null> {
  try {
    const infoUrl = joinUrl(anchorUrl, "/sep24/info");
    const res = await fetch(infoUrl);
    if (!res.ok) throw new Error(`Anchor /info returned ${res.status}`);
    return (await res.json()) as AnchorInfo;
  } catch (err) {
    console.warn("Failed to fetch anchor info:", err);
    return null;
  }
}

export async function initiateAnchorFlow(params: {
  anchorUrl: string;
  type: "deposit" | "withdraw";
  assetCode: string;
  publicKey: string;
}): Promise<AnchorFlowResult> {
  const { anchorUrl, type, assetCode, publicKey } = params;

  const info = await getAnchorInfo(anchorUrl);
  if (info) {
    const section = type === "deposit" ? info.deposit : info.withdraw;
    const assetConfig = section[assetCode];
    if (!assetConfig || !assetConfig.enabled) {
      throw new Error(`${assetCode} ${type} is not supported by this anchor.`);
    }
  }

  const endpoint = type === "deposit"
    ? joinUrl(anchorUrl, "/sep24/transactions/deposit/interactive")
    : joinUrl(anchorUrl, "/sep24/transactions/withdraw/interactive");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset_code: assetCode,
      account: publicKey,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anchor ${type} request failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { url?: string; id?: string };

  if (!data.url) {
    throw new Error("Anchor did not return a redirect URL.");
  }

  return {
    url: data.url,
    id: data.id || "",
  };
}
