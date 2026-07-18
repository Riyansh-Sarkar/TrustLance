import type { Contract, MilestoneStatus } from "@/types";
import { db, serializeDate } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  or,
  updateDoc, 
  deleteDoc,
  type DocumentSnapshot
} from "firebase/firestore";

// Helper to convert Firestore doc to Contract type
function docToContract(docSnap: DocumentSnapshot): Contract {
  const data = docSnap.data();
  if (!data) {
    throw new Error("No data found in contract snapshot");
  }
  return {
    ...data,
    id: docSnap.id,
    createdAt: new Date(serializeDate(data.createdAt)),
    updatedAt: new Date(serializeDate(data.updatedAt)),
  } as Contract;
}

export function generateContractId(): string {
  return "contract_" + Math.random().toString(36).substring(2, 11);
}

export async function createContract(
  data: Omit<Contract, "id" | "createdAt" | "updatedAt">,
  customId?: string
): Promise<string> {
  const mockId = customId || generateContractId();
  const docRef = doc(db, "contracts", mockId);
  await setDoc(docRef, {
    ...data,
    id: mockId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return mockId;
}

export async function getContract(id: string): Promise<Contract | null> {
  try {
    const docRef = doc(db, "contracts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docToContract(docSnap);
    }
  } catch (e) {
    console.error("Firestore getContract failed:", e);
  }
  return null;
}

function getTimestampMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  if (value && typeof value === "object" && "toMillis" in value) {
    const v = value as { toMillis: () => number };
    return v.toMillis();
  }
  return 0;
}

export async function getUserContracts(
  walletAddress: string
): Promise<Contract[]> {
  try {
    const q = query(
      collection(db, "contracts"),
      or(
        where("clientWallet", "==", walletAddress),
        where("freelancerWallet", "==", walletAddress)
      )
    );
    const snap = await getDocs(q);
    const contracts: Contract[] = [];
    snap.forEach((doc) => {
      contracts.push(docToContract(doc));
    });
    return contracts.sort((a, b) => {
      return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
    });
  } catch (e) {
    console.error("Firestore getUserContracts failed:", e);
    return [];
  }
}

export async function updateMilestoneStatus(
  contractId: string,
  milestoneId: number,
  status: MilestoneStatus,
  deliverableUrl?: string
) {
  try {
    const c = await getContract(contractId);
    if (!c) return;

    const updatedMilestones = [...c.milestones];
    updatedMilestones[milestoneId] = {
      ...updatedMilestones[milestoneId],
      status,
      ...(deliverableUrl ? { deliverableUrl } : {})
    };

    const isClosed = updatedMilestones.every(m => m.status === "approved" || m.status === "released");
    const docRef = doc(db, "contracts", contractId);
    await updateDoc(docRef, {
      milestones: updatedMilestones,
      ...(isClosed ? { isClosed: true } : {}),
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firestore updateMilestoneStatus failed:", e);
  }
}

export async function updateContract(
  contractId: string,
  updates: Partial<Contract>
) {
  try {
    const docRef = doc(db, "contracts", contractId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firestore updateContract failed:", e);
  }
}

export async function saveFeedback(contractId: string, feedback: {
  rating: number;
  comment: string;
  walletAddress: string;
}) {
  try {
    const feedbackId = "feedback_" + Math.random().toString(36).substring(2, 11);
    const docRef = doc(db, "feedbacks", feedbackId);
    await setDoc(docRef, {
      id: feedbackId,
      contractId,
      ...feedback,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firestore saveFeedback failed:", e);
  }
}

export async function flagDispute(contractId: string) {
  try {
    const docRef = doc(db, "contracts", contractId);
    await updateDoc(docRef, {
      isDisputed: true,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firestore flagDispute failed:", e);
  }
}

export async function deleteContract(contractId: string) {
  try {
    const docRef = doc(db, "contracts", contractId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("Firestore deleteContract failed:", e);
  }
}

export async function acceptContract(contractId: string) {
  try {
    const docRef = doc(db, "contracts", contractId);
    await updateDoc(docRef, {
      isAccepted: true,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firestore acceptContract failed:", e);
  }
}
