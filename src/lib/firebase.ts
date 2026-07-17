import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBk-YEPTWRuJ8EOHez-SVtNqI95caYfFd8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trustlence.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trustlence",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trustlence.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1058271473709",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1058271473709:web:8fc5779eab279b17e8c8a4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DSZTQ4HNCB"
};

// Initialize Firebase (SSR friendly)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

// Profile helpers
export async function getProfile(address: string) {
  try {
    const docRef = doc(db, "profiles", address);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { username: string; pfpUrl: string };
    }
  } catch (e) {
    console.error("Firestore getProfile failed:", e);
  }
  return null;
}

export async function updateProfile(address: string, profile: { username: string; pfpUrl: string }) {
  try {
    const docRef = doc(db, "profiles", address);
    await setDoc(docRef, profile, { merge: true });
  } catch (e) {
    console.error("Firestore updateProfile failed:", e);
  }
}

// Preferences helpers
export async function getPreferences(address: string) {
  try {
    const docRef = doc(db, "preferences", address);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { role?: string; email?: string; currency?: string; notifications?: boolean };
    }
  } catch (e) {
    console.error("Firestore getPreferences failed:", e);
  }
  return null;
}

export async function updatePreferences(address: string, preferences: any) {
  try {
    const docRef = doc(db, "preferences", address);
    await setDoc(docRef, preferences, { merge: true });
  } catch (e) {
    console.error("Firestore updatePreferences failed:", e);
  }
}

// Serialize Date utility for Firestore
export function serializeDate(date: any): string {
  if (date instanceof Date) return date.toISOString();
  if (typeof date === "string") return date;
  if (date && typeof date === "object" && "toISOString" in date) return (date as any).toISOString();
  if (date && typeof date === "object" && "toDate" in date && typeof date.toDate === "function") {
    return date.toDate().toISOString();
  }
  if (date && typeof date === "object" && "seconds" in date && typeof date.seconds === "number") {
    return new Date(date.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

// Background migration helper
export async function migrateLocalStorageToFirestore(walletAddress: string) {
  if (typeof window === "undefined" || !walletAddress) return;

  // 1. Profile migration
  const profileKey = `fp_profile_${walletAddress}`;
  const localProfile = localStorage.getItem(profileKey);
  if (localProfile) {
    try {
      const parsed = JSON.parse(localProfile);
      const remote = await getProfile(walletAddress);
      if (!remote) {
        await updateProfile(walletAddress, parsed);
      }
    } catch {}
  }

  // 2. Preferences migration
  const prefsKey = `fp_prefs_${walletAddress}`;
  const localPrefs = localStorage.getItem(prefsKey);
  if (localPrefs) {
    try {
      const parsed = JSON.parse(localPrefs);
      const remote = await getPreferences(walletAddress);
      if (!remote) {
        await updatePreferences(walletAddress, parsed);
      } else {
        await updatePreferences(walletAddress, { ...parsed, ...remote });
      }
    } catch {}
  }

  // 3. Contracts migration
  const contractsKey = "trustlance_mock_contracts";
  const contractsData = localStorage.getItem(contractsKey);
  if (contractsData) {
    try {
      const contracts: any[] = JSON.parse(contractsData);
      for (const c of contracts) {
        if (!c.id) continue;
        const docRef = doc(db, "contracts", c.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            ...c,
            createdAt: serializeDate(c.createdAt),
            updatedAt: serializeDate(c.updatedAt),
          });
        }
      }
      localStorage.removeItem(contractsKey);
    } catch (e) {
      console.error("Migration failed for contracts:", e);
    }
  }

  // 4. Jobs migration
  const jobsKey = "trustlance_mock_jobs";
  const jobsData = localStorage.getItem(jobsKey);
  if (jobsData) {
    try {
      const jobs: any[] = JSON.parse(jobsData);
      for (const j of jobs) {
        if (!j.id) continue;
        const docRef = doc(db, "jobs", j.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            ...j,
            createdAt: serializeDate(j.createdAt),
            updatedAt: serializeDate(j.updatedAt),
          });
        }
      }
      localStorage.removeItem(jobsKey);
    } catch (e) {
      console.error("Migration failed for jobs:", e);
    }
  }

  // 5. Applications migration
  const appsKey = "trustlance_mock_apps";
  const appsData = localStorage.getItem(appsKey);
  if (appsData) {
    try {
      const apps: any[] = JSON.parse(appsData);
      for (const a of apps) {
        if (!a.id) continue;
        const docRef = doc(db, "applications", a.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            ...a,
            createdAt: serializeDate(a.createdAt),
            updatedAt: serializeDate(a.updatedAt),
          });
        }
      }
      localStorage.removeItem(appsKey);
    } catch (e) {
      console.error("Migration failed for applications:", e);
    }
  }

  // 6. Swap Events migration
  const swapsKey = "trustlance_mock_swap_events";
  const swapsData = localStorage.getItem(swapsKey);
  if (swapsData) {
    try {
      const swaps: any[] = JSON.parse(swapsData);
      for (const s of swaps) {
        if (!s.id) continue;
        const docRef = doc(db, "swap_events", s.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            ...s,
            createdAt: serializeDate(s.createdAt),
          });
        }
      }
      localStorage.removeItem(swapsKey);
    } catch (e) {
      console.error("Migration failed for swaps:", e);
    }
  }

  // 7. Growth telemetry migration
  const telemetryKeys = [
    { local: 'trustlance_mock_feedback_growth', col: 'growth_feedback' },
    { local: 'trustlance_mock_invites', col: 'growth_invites' },
    { local: 'trustlance_mock_tx_events', col: 'growth_tx_events' },
    { local: 'trustlance_mock_onboarding_events', col: 'growth_onboarding_events' }
  ];

  for (const { local, col } of telemetryKeys) {
    const data = localStorage.getItem(local);
    if (data) {
      try {
        const items: any[] = JSON.parse(data);
        for (const item of items) {
          if (!item.id) continue;
          const docRef = doc(db, col, item.id);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              ...item,
              ...(item.createdAt ? { createdAt: serializeDate(item.createdAt) } : {}),
              ...(item.timestamp ? { timestamp: serializeDate(item.timestamp) } : {})
            });
          }
        }
        localStorage.removeItem(local);
      } catch (e) {
        console.error(`Migration failed for ${col}:`, e);
      }
    }
  }
}
