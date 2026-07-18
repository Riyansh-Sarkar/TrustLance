"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { Redirect } from "@/components/Redirect";
import { m, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Briefcase, ChevronRight, ArrowRight, Code2, ArrowLeft, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

export default function AuthWizard() {
  const { isConnected, supportedWallets, connectWallet, disconnectWallet, publicKey, walletNetwork } = useWallet();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<"freelancer" | "client" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { updateProfile } = useProfile(publicKey);

  const getEmailProvider = (emailAddress: string) => {
    const domain = emailAddress.split("@")[1]?.toLowerCase();
    if (!domain) return null;
    if (domain.includes("gmail")) return "Gmail";
    if (domain.includes("proton")) return "ProtonMail";
    if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) return "Outlook";
    if (domain.includes("yahoo")) return "Yahoo";
    if (domain.includes("icloud") || domain.includes("me") || domain.includes("mac")) return "iCloud";
    return domain;
  };

  const emailProvider = getEmailProvider(email);

  const configuredSiteNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "PUBLIC" ? "MAINNET" : "TESTNET";
  const isWrongNetwork = isConnected && walletNetwork && walletNetwork !== configuredSiteNetwork;

  if (isWrongNetwork) {
    return (
      <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        <Link href="/" className="absolute top-8 left-8 z-20">
          <Logo iconSize={32} textSize="text-xl" subTextSize="text-[8px]" />
        </Link>

        <div className="relative z-10 w-full max-w-[480px] card glass-panel rounded-[20px] overflow-hidden flex flex-col p-8 items-center text-center">
          <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center text-status-error mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-section-title text-ink-primary mb-2">Wrong Network</h2>
          <p className="text-ui-label text-ink-secondary mb-6">
            Your wallet is connected to <strong className="text-status-error">{walletNetwork}</strong>, but TrustLance is currently running on <strong className="text-status-success">{configuredSiteNetwork}</strong>.
          </p>
          <p className="text-[14px] text-ink-tertiary mb-8">
            Please open your wallet extension, switch your network to {configuredSiteNetwork}, and verify again.
          </p>
          <div className="flex w-full gap-4">
            <button onClick={disconnectWallet} className="flex-1 p-3 border border-edge-neutral bg-bg-interactive rounded-xl font-medium text-ink-primary hover:border-ink-secondary transition-colors">
              Disconnect
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 p-3 neopop-button-teal rounded-xl font-medium">
              Verify Network
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If already fully connected and wizard is done, or if just revisiting
  // We'll let them go through the wizard if they are here, but if they hit step 4, we redirect.
  if (isConnected && step === 1) {
    // If they land on this page and are already connected, just send to dashboard
    return <Redirect to="/dashboard" />;
  }

  const handleWalletSelect = async (id: string) => {
    const success = await connectWallet(id);
    if (success) {
      const address = localStorage.getItem("fp_wallet_address");
      if (address) {
        let hasProfile = !!localStorage.getItem(`fp_profile_${address}`);
        if (!hasProfile) {
          try {
            const { getProfile } = await import("@/lib/firebase");
            const remoteProfile = await getProfile(address);
            hasProfile = !!remoteProfile;
            if (remoteProfile) {
              localStorage.setItem(`fp_profile_${address}`, JSON.stringify(remoteProfile));
            }
          } catch (e) {
            console.error("Failed to check profile in Firestore:", e);
          }
        }

        import("@/lib/firebase").then(({ migrateLocalStorageToFirestore }) => {
          migrateLocalStorageToFirestore(address).catch((e) => console.error("Migration failed:", e));
        });

        setDirection(1);
        if (hasProfile) {
          setStep(4);
        } else {
          setStep(2);
        }
      }
    }
  };

  const handleRoleSelect = (selectedRole: "freelancer" | "client") => {
    setRole(selectedRole);
    setDirection(1);
    setStep(3);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    // Save to profile so dashboard picks it up immediately
    updateProfile({ username: name, pfpUrl: "" });
    if (typeof window !== "undefined" && publicKey) {
      localStorage.setItem(`fp_prefs_${publicKey}`, JSON.stringify({ role, email }));
      import("@/lib/firebase").then(({ updatePreferences }) => {
        updatePreferences(publicKey, { role, email });
      });
    }

    setDirection(1);
    setStep(4);
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 3% Noise Texture */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <Link href="/" className="absolute top-8 left-8 z-20">
        <Logo iconSize={32} textSize="text-xl" subTextSize="text-[8px]" />
      </Link>

      {/* Main Wizard Card */}
      <div className="relative z-10 w-full max-w-[480px] card glass-panel rounded-[20px] overflow-hidden flex flex-col">
        {/* Step Indicator */}
        <div className="px-8 pt-8 pb-4 flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-bg-interactive"}`} />
          ))}
        </div>

        <div className="relative flex-1 min-h-[400px] overflow-hidden px-8 pb-8">
          <AnimatePresence custom={direction} mode="wait">
            
            {step === 1 && (
              <m.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full"
              >
                <h2 className="text-section-title text-ink-primary mb-2">Connect Wallet</h2>
                <p className="text-ui-label text-ink-secondary mb-8">Select a Stellar wallet to continue.</p>
                
                <div className="space-y-3">
                  {supportedWallets.map(wallet => (
                    <button
                      key={wallet.id}
                      onClick={() => handleWalletSelect(wallet.id)}
                      disabled={!wallet.isAvailable && !wallet.isPlatformWrapper}
                      className="w-full card card-interactive flex items-center justify-between p-4 group text-left disabled:opacity-50 disabled:cursor-not-allowed border border-edge-neutral hover:border-accent hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-bg-interactive p-1 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all border border-edge-neutral">
                          <Image src={wallet.icon} alt={wallet.name} width={24} height={24} className="object-contain" />
                        </div>
                        <span className="font-medium text-ink-primary group-hover:text-accent transition-colors">{wallet.name}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-tertiary group-hover:text-accent transition-colors" />
                    </button>
                  ))}
                </div>
              </m.div>
            )}

            {step === 2 && (
              <m.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={goBack} className="p-2 border border-edge-neutral rounded-xl bg-bg-void hover:bg-bg-base hover:border-ink-secondary transition-all text-ink-primary hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-section-title text-ink-primary">Select Role</h2>
                </div>
                <p className="text-ui-label text-ink-secondary mb-8">How will you use TrustLance?</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect("client")}
                    className="card card-interactive p-6 flex flex-col items-center text-center gap-4 hover:border-accent hover:bg-accent-glow transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-bg-interactive flex items-center justify-center text-ink-secondary">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-primary mb-1">Client</h3>
                      <p className="text-[12px] text-ink-secondary">I want to hire and fund escrows.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect("freelancer")}
                    className="card card-interactive p-6 flex flex-col items-center text-center gap-4 hover:border-accent hover:bg-accent-glow transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-bg-interactive flex items-center justify-center text-ink-secondary">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-primary mb-1">Freelancer</h3>
                      <p className="text-[12px] text-ink-secondary">I want to work and get paid.</p>
                    </div>
                  </button>
                </div>
              </m.div>
            )}

            {step === 3 && (
              <m.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={goBack} className="p-2 border border-edge-neutral rounded-xl bg-bg-void hover:bg-bg-base hover:border-ink-secondary transition-all text-ink-primary hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-section-title text-ink-primary">Profile Basics</h2>
                </div>
                <p className="text-ui-label text-ink-secondary mb-8">Just a few details to get started.</p>
                
                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5 flex-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-ui-label text-ink-secondary">Display Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="e.g. Satoshi Nakamoto"
                      className="bg-bg-interactive border border-edge-neutral rounded-xl p-3 text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-glow focus:border-accent transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-ui-label text-ink-secondary flex items-center justify-between">
                      Email Address
                      {emailProvider && (
                        <span className="text-xs text-accent flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3" />
                          {emailProvider}
                        </span>
                      )}
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="satoshi@example.com"
                      className="bg-bg-interactive border border-edge-neutral rounded-xl p-3 pr-24 text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-glow focus:border-accent transition-all"
                    />
                  </div>
                  
                  <div className="mt-auto pt-8">
                    <button type="submit" className="w-full neopop-button-teal text-ui-label px-5 py-4 font-medium flex items-center justify-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </m.div>
            )}

            {step === 4 && (
              <m.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center h-full min-h-[300px]"
              >
                {!isConnected ? (
                   <div className="flex flex-col items-center gap-4">
                     <Loader2 className="w-12 h-12 text-accent animate-spin" />
                     <p className="text-ui-label text-ink-secondary">Connecting Wallet...</p>
                   </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <m.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-status-released" />
                    </m.div>
                    <h2 className="text-section-title text-ink-primary">All set!</h2>
                    <p className="text-ui-label text-ink-secondary">Redirecting to dashboard...</p>
                    {/* Trigger redirect */}
                    <Redirect to="/dashboard" />
                  </div>
                )}
              </m.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
