import { FeedbackEntry, Invite, TransactionEvent, OnboardingEvent } from '@/types/growth';
import { db, serializeDate } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  type DocumentSnapshot
} from "firebase/firestore";

// Helper to convert Firestore doc to TransactionEvent type
function docToTxEvent(docSnap: DocumentSnapshot): TransactionEvent {
  const data = docSnap.data();
  if (!data) {
    throw new Error("No data found in transaction event snapshot");
  }
  return {
    ...data,
    id: docSnap.id,
    timestamp: new Date(serializeDate(data.timestamp)),
  } as TransactionEvent;
}

export const submitFeedback = async (feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>) => {
  const id = "feedback_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "growth_feedback", id);
  await setDoc(docRef, {
    ...feedback,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
};

export const createInvite = async (invite: Omit<Invite, 'id' | 'createdAt'>) => {
  const id = "invite_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "growth_invites", id);
  await setDoc(docRef, {
    ...invite,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
};

export const logTransactionEvent = async (event: Omit<TransactionEvent, 'id' | 'timestamp'>) => {
  const id = "tx_event_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "growth_tx_events", id);
  await setDoc(docRef, {
    ...event,
    id,
    timestamp: new Date().toISOString(),
  });
  return id;
};

export const logOnboardingEvent = async (event: Omit<OnboardingEvent, 'id' | 'timestamp'>) => {
  const id = "onboard_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "growth_onboarding_events", id);
  await setDoc(docRef, {
    ...event,
    id,
    timestamp: new Date().toISOString(),
  });
  return id;
};

export const getTransactionEvents = async (contractId: string) => {
  try {
    const q = query(collection(db, "growth_tx_events"), where("contractId", "==", contractId));
    const snap = await getDocs(q);
    const events: TransactionEvent[] = [];
    snap.forEach((doc) => {
      events.push(docToTxEvent(doc));
    });
    return events.sort((a, b) => new Date(a.timestamp as string | Date).getTime() - new Date(b.timestamp as string | Date).getTime());
  } catch (e) {
    console.error("Firestore getTransactionEvents failed:", e);
    return [];
  }
};
