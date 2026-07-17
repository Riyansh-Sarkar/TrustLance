export type MilestoneStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "released"
  | "disputed";

export interface Milestone {
  id: number;
  description: string;
  amount: number;
  status: MilestoneStatus;
  deliverableUrl?: string;
}

export interface Contract {
  id: string;
  contractAddress: string;
  clientWallet: string;
  freelancerWallet: string;
  title: string;
  description: string;
  totalAmount: number;
  milestones: Milestone[];
  isDisputed: boolean;
  isClosed: boolean;
  isAccepted?: boolean;
  jobId?: string;
  applicationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  walletAddress: string;
  displayName: string;
  email: string;
  role: "client" | "freelancer";
  createdAt: Date;
}

export interface ActivityItem {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  desc: string;
  date: number;
  time: string;
  txHash?: string;
  explorerUrl?: string;
}

export interface NewContractFormData {
  title: string;
  description: string;
  freelancerAddress: string;
  milestones: { description: string; amount: string; deliverableUrl?: string }[];
  jobId?: string;
  applicationId?: string;
}

export type JobStatus = "open" | "closed";

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface JobApplication {
  id: string;
  jobId: string;
  freelancerWallet: string;
  proposal: string;
  bidAmount: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalanceResult {
  balance: string;
  error: string | null;
}

export interface SupportedWallet {
  id: string;
  name: string;
  icon: string;
  isAvailable?: boolean;
  isPlatformWrapper?: boolean;
}
