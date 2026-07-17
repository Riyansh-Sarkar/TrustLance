interface PriceCache {
  xlmUsd: number;
  fetchedAt: number;
}

let cache: PriceCache | null = null;
const TTL_MS = 60 * 1000;
const TIMEOUT_MS = 5000;

interface PriceSource {
  url: string;
  parse: (text: string) => number | null;
}

const SOURCES: PriceSource[] = [
  {
    url: "https://api.coinbase.com/v2/prices/XLM-USD/spot",
    parse: (text) => {
      try {
        const json = JSON.parse(text) as { data?: { amount?: string } };
        const amt = Number(json.data?.amount);
        return Number.isFinite(amt) && amt > 0 ? amt : null;
      } catch {
        return null;
      }
    },
  },
  {
    url: "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
    parse: (text) => {
      try {
        const json = JSON.parse(text) as { stellar?: { usd?: number } };
        const amt = Number(json.stellar?.usd);
        return Number.isFinite(amt) && amt > 0 ? amt : null;
      } catch {
        return null;
      }
    },
  },
];

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchXlmUsdPrice(): Promise<number | null> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.xlmUsd;
  }

  for (const source of SOURCES) {
    const text = await fetchWithTimeout(source.url, TIMEOUT_MS);
    if (!text) continue;
    const value = source.parse(text);
    if (value !== null) {
      cache = { xlmUsd: value, fetchedAt: Date.now() };
      return value;
    }
  }

  return null;
}

export function convertXlmToUsd(xlmAmount: number, xlmUsd: number): number {
  return xlmAmount * xlmUsd;
}

export function convertUsdToXlm(usdAmount: number, xlmUsd: number): number {
  if (xlmUsd === 0) return 0;
  return usdAmount / xlmUsd;
}
