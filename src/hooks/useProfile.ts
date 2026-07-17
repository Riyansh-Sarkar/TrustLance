import { useCallback, useState, useEffect } from "react";
import { getProfile, updateProfile as dbUpdateProfile } from "@/lib/firebase";

interface UserProfile {
  username: string;
  pfpUrl: string;
}

export function useProfile(publicKey: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`fp_profile_${publicKey}`);
      if (cached) {
        try {
          setProfile(JSON.parse(cached));
        } catch {}
      }
    }

    let active = true;
    setIsLoading(true);

    getProfile(publicKey)
      .then((data) => {
        if (active && data) {
          const profileData = { username: data.username, pfpUrl: data.pfpUrl || "" };
          setProfile(profileData);
          if (typeof window !== "undefined") {
            localStorage.setItem(`fp_profile_${publicKey}`, JSON.stringify(profileData));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load profile from Firestore:", err);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [publicKey]);

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    if (!publicKey) return;
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem(`fp_profile_${publicKey}`, JSON.stringify(newProfile));
      window.dispatchEvent(new Event("local-storage"));
    }
    await dbUpdateProfile(publicKey, newProfile);
  }, [publicKey]);

  return { profile, updateProfile, isLoading };
}
