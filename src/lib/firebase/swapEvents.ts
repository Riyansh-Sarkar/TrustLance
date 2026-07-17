export interface SwapEvent {
  id: string;
  walletAddress: string;
  direction: "buy_usdc" | "sell_usdc";
  sourceAsset: string;
  destAsset: string;
  sourceAmount: string;
  destinationAmount: string;
  txHash?: string;
  status: "submitted" | "completed" | "failed";
  createdAt: Date;
  errorMessage?: string;
}

const LOCAL_STORAGE_KEY = "freelancepay_mock_swap_events";

function getLocalEvents(): SwapEvent[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as SwapEvent[]) : [];
}

function saveLocalEvents(events: SwapEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
}

export async function recordSwapEvent(
  data: Omit<SwapEvent, "id" | "createdAt">
): Promise<string> {
  const newEvent: SwapEvent = {
    ...data,
    id: "local_" + Math.random().toString(36).substring(2, 11),
    createdAt: new Date(),
  };
  const local = getLocalEvents();
  saveLocalEvents([newEvent, ...local].slice(0, 50));
  return newEvent.id;
}

export async function getUserSwapEvents(
  walletAddress: string,
  limit = 10
): Promise<SwapEvent[]> {
  return getLocalEvents()
    .filter((e) => e.walletAddress === walletAddress)
    .map((e) => ({ ...e, createdAt: new Date(e.createdAt) }))
    .slice(0, limit);
}
