import type { Job, JobApplication } from "@/types";

const LOCAL_STORAGE_JOBS_KEY = "trustlance_mock_jobs";
const LOCAL_STORAGE_APPS_KEY = "trustlance_mock_apps";

function getLocalJobs(): Job[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalJobs(jobs: Job[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_JOBS_KEY, JSON.stringify(jobs));
}

function getLocalApps(): JobApplication[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalApps(apps: JobApplication[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
}

export async function createJob(
  data: Omit<Job, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const mockId = "job_" + Math.random().toString(36).substring(2, 11);
  const newJob: Job = {
    ...data,
    id: mockId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const local = getLocalJobs();
  saveLocalJobs([...local, newJob]);
  return mockId;
}

export async function getJobs(): Promise<Job[]> {
  return getLocalJobs()
    .filter((j) => j.status === "open")
    .map((j) => ({ ...j, createdAt: new Date(j.createdAt), updatedAt: new Date(j.updatedAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getMyJobs(clientId: string): Promise<Job[]> {
  return getLocalJobs()
    .filter((j) => j.clientId === clientId)
    .map((j) => ({ ...j, createdAt: new Date(j.createdAt), updatedAt: new Date(j.updatedAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getJob(id: string): Promise<Job | null> {
  const job = getLocalJobs().find((j) => j.id === id);
  if (!job) return null;
  return {
    ...job,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

export async function updateJobStatus(id: string, status: "open" | "closed") {
  const local = getLocalJobs();
  saveLocalJobs(
    local.map((j) => (j.id === id ? { ...j, status, updatedAt: new Date() } : j))
  );
}

export async function deleteJob(id: string) {
  const local = getLocalJobs();
  saveLocalJobs(local.filter((j) => j.id !== id));
}

export async function applyToJob(
  data: Omit<JobApplication, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const mockId = "app_" + Math.random().toString(36).substring(2, 11);
  const newApp: JobApplication = {
    ...data,
    id: mockId,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const local = getLocalApps();
  saveLocalApps([...local, newApp]);
  return mockId;
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  return getLocalApps()
    .filter((a) => a.jobId === jobId)
    .map((a) => ({ ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateApplicationStatus(
  id: string,
  status: "pending" | "accepted" | "rejected"
) {
  const local = getLocalApps();
  saveLocalApps(
    local.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date() } : a))
  );
}
