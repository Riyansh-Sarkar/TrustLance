import { useCallback, useSyncExternalStore } from "react";

interface UserProfile {
  username: string;
  pfpUrl: string;
}

const getServerSnapshot = () => null;

export function useProfile(publicKey: string | null) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener("local-storage", onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener("local-storage", onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (!publicKey || typeof window === "undefined") return null;
    return localStorage.getItem(`fp_profile_${publicKey}`);
  }, [publicKey]);

  const profileRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  let profile: UserProfile | null = null;
  if (profileRaw) {
    try { profile = JSON.parse(profileRaw); } catch {}
  }

  const updateProfile = useCallback((newProfile: UserProfile) => {
    if (typeof window !== "undefined" && publicKey) {
      localStorage.setItem(`fp_profile_${publicKey}`, JSON.stringify(newProfile));
      window.dispatchEvent(new Event("local-storage"));
    }
  }, [publicKey]);

  return { profile, updateProfile };
}
