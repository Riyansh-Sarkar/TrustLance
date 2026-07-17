import type { Contract, MilestoneStatus } from "@/types";

const LOCAL_STORAGE_KEY = "trustlance_mock_contracts";
const LOCAL_STORAGE_FEEDBACK_KEY = "trustlance_mock_feedback";

function getLocalContracts(): Contract[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalContracts(contracts: Contract[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contracts));
}

function getLocalFeedback(): any[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_FEEDBACK_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalFeedback(feedback: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_FEEDBACK_KEY, JSON.stringify(feedback));
}

export function generateContractId(): string {
  return "contract_" + Math.random().toString(36).substring(2, 11);
}

export async function createContract(
  data: Omit<Contract, "id" | "createdAt" | "updatedAt">,
  customId?: string
): Promise<string> {
  const mockId = customId || generateContractId();
  const newContract: Contract = {
    ...data,
    id: mockId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const local = getLocalContracts();
  saveLocalContracts([...local, newContract]);
  return mockId;
}

export async function getContract(id: string): Promise<Contract | null> {
  const local = getLocalContracts();
  const c = local.find(c => c.id === id);
  if (!c) return null;
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
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
  const local = getLocalContracts();
  return local
    .filter(c => c.clientWallet === walletAddress || c.freelancerWallet === walletAddress)
    .map(c => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }))
    .sort((a, b) => {
      return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
    });
}

export async function updateMilestoneStatus(
  contractId: string,
  milestoneId: number,
  status: MilestoneStatus,
  deliverableUrl?: string
) {
  let local = getLocalContracts();
  local = local.map(c => {
    if (c.id === contractId) {
      const updatedMilestones = [...c.milestones];
      updatedMilestones[milestoneId] = {
        ...updatedMilestones[milestoneId],
        status,
        ...(deliverableUrl ? { deliverableUrl } : {})
      };
      const isClosed = updatedMilestones.every(m => m.status === "approved" || m.status === "released");
      return { 
        ...c, 
        milestones: updatedMilestones, 
        ...(isClosed ? { isClosed: true } : {}),
        updatedAt: new Date() 
      };
    }
    return c;
  });
  saveLocalContracts(local);
}

export async function updateContract(
  contractId: string,
  updates: Partial<Contract>
) {
  let local = getLocalContracts();
  local = local.map(c => {
    if (c.id === contractId) {
      return { 
        ...c, 
        ...updates,
        updatedAt: new Date() 
      } as Contract;
    }
    return c;
  });
  saveLocalContracts(local);
}

export async function saveFeedback(contractId: string, feedback: {
  rating: number;
  comment: string;
  walletAddress: string;
}) {
  const local = getLocalFeedback();
  const newFeedback = {
    id: "feedback_" + Math.random().toString(36).substring(2, 11),
    contractId,
    ...feedback,
    createdAt: new Date()
  };
  saveLocalFeedback([...local, newFeedback]);
}

export async function flagDispute(contractId: string) {
  const local = getLocalContracts();
  const updated = local.map(c =>
    c.id === contractId
      ? { ...c, isDisputed: true, updatedAt: new Date() }
      : c
  );
  saveLocalContracts(updated);
}

export async function deleteContract(contractId: string) {
  let local = getLocalContracts();
  local = local.filter(c => c.id !== contractId);
  saveLocalContracts(local);
}

export async function acceptContract(contractId: string) {
  let local = getLocalContracts();
  local = local.map(c => c.id === contractId ? { ...c, isAccepted: true, updatedAt: new Date() } : c);
  saveLocalContracts(local);
}
