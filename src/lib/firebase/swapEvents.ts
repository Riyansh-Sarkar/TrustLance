import { db, serializeDate } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  limit as firestoreLimit,
  type DocumentSnapshot
} from "firebase/firestore";

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

// Helper to convert Firestore doc to SwapEvent type
function docToSwapEvent(docSnap: DocumentSnapshot): SwapEvent {
  const data = docSnap.data();
  if (!data) {
    throw new Error("No data found in swap event snapshot");
  }
  return {
    ...data,
    id: docSnap.id,
    createdAt: new Date(serializeDate(data.createdAt)),
  } as SwapEvent;
}

export async function recordSwapEvent(
  data: Omit<SwapEvent, "id" | "createdAt">
): Promise<string> {
  const id = "swap_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "swap_events", id);
  await setDoc(docRef, {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getUserSwapEvents(
  walletAddress: string,
  limit = 10
): Promise<SwapEvent[]> {
  try {
    const q = query(
      collection(db, "swap_events"),
      where("walletAddress", "==", walletAddress),
      firestoreLimit(limit)
    );
    const snap = await getDocs(q);
    const events: SwapEvent[] = [];
    snap.forEach((doc) => {
      events.push(docToSwapEvent(doc));
    });
    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error("Firestore getUserSwapEvents failed:", e);
    return [];
  }
}
