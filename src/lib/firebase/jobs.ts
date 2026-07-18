import type { Job, JobApplication } from "@/types";
import { db, serializeDate } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  type DocumentSnapshot
} from "firebase/firestore";

// Helper to convert Firestore doc to Job type
function docToJob(docSnap: DocumentSnapshot): Job {
  const data = docSnap.data();
  if (!data) {
    throw new Error("No data found in job snapshot");
  }
  return {
    ...data,
    id: docSnap.id,
    createdAt: new Date(serializeDate(data.createdAt)),
    updatedAt: new Date(serializeDate(data.updatedAt)),
  } as Job;
}

// Helper to convert Firestore doc to JobApplication type
function docToApp(docSnap: DocumentSnapshot): JobApplication {
  const data = docSnap.data();
  if (!data) {
    throw new Error("No data found in job application snapshot");
  }
  return {
    ...data,
    id: docSnap.id,
    createdAt: new Date(serializeDate(data.createdAt)),
    updatedAt: new Date(serializeDate(data.updatedAt)),
  } as JobApplication;
}

export async function createJob(
  data: Omit<Job, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const jobId = "job_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "jobs", jobId);
  await setDoc(docRef, {
    ...data,
    id: jobId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return jobId;
}

export async function getJobs(): Promise<Job[]> {
  try {
    const q = query(collection(db, "jobs"), where("status", "==", "open"));
    const snap = await getDocs(q);
    const jobs: Job[] = [];
    snap.forEach((doc) => {
      jobs.push(docToJob(doc));
    });
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error("Firestore getJobs failed:", e);
    return [];
  }
}

export async function getMyJobs(clientId: string): Promise<Job[]> {
  try {
    const q = query(collection(db, "jobs"), where("clientId", "==", clientId));
    const snap = await getDocs(q);
    const jobs: Job[] = [];
    snap.forEach((doc) => {
      jobs.push(docToJob(doc));
    });
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error("Firestore getMyJobs failed:", e);
    return [];
  }
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    const docRef = doc(db, "jobs", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docToJob(docSnap);
    }
  } catch (e) {
    console.error("Firestore getJob failed:", e);
  }
  return null;
}

export async function updateJobStatus(id: string, status: "open" | "closed") {
  try {
    const docRef = doc(db, "jobs", id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Firestore updateJobStatus failed:", e);
  }
}

export async function deleteJob(id: string) {
  try {
    const docRef = doc(db, "jobs", id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("Firestore deleteJob failed:", e);
  }
}

export async function applyToJob(
  data: Omit<JobApplication, "id" | "status" | "createdAt" | "updatedAt">
): Promise<string> {
  const appId = "app_" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "applications", appId);
  await setDoc(docRef, {
    ...data,
    id: appId,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return appId;
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  try {
    const q = query(collection(db, "applications"), where("jobId", "==", jobId));
    const snap = await getDocs(q);
    const apps: JobApplication[] = [];
    snap.forEach((doc) => {
      apps.push(docToApp(doc));
    });
    return apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error("Firestore getJobApplications failed:", e);
    return [];
  }
}

export async function updateApplicationStatus(
  id: string,
  status: "pending" | "accepted" | "rejected"
) {
  try {
    const docRef = doc(db, "applications", id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Firestore updateApplicationStatus failed:", e);
  }
}
