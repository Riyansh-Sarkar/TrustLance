import React, { useState } from "react";
import { X, Upload, Camera } from "lucide-react";
import { m, AnimatePresence } from 'framer-motion';
import Image from "next/image";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUsername: string;
  initialPfp: string;
  onSave: (username: string, pfpUrl: string) => void;
}

export function ProfileModal({ isOpen, onClose, initialUsername, initialPfp, onSave }: ProfileModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [pfpUrl, setPfpUrl] = useState(initialPfp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(username.trim(), pfpUrl.trim());
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPfpUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-bg-void/90"
            onClick={onClose}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm bg-bg-base border-2 border-edge-neutral overflow-hidden shadow-neopop"
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-edge-neutral bg-bg-base">
              <h3 className="font-headline-lg text-xl font-bold uppercase tracking-tight text-ink-primary">
                Edit Profile
              </h3>
              <button type="button"
                onClick={onClose}
                className="p-1.5 border-2 border-transparent hover:border-edge-neutral text-ink-secondary hover:bg-bg-void hover:text-ink-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer mb-3">
                  <input
                    aria-label="Upload Avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-24 h-24 rounded-none border-2 border-edge-neutral bg-bg-void overflow-hidden flex items-center justify-center group-hover:border-accent transition-colors shadow-neopop">
                    {pfpUrl ? (
                      <Image 
                        src={pfpUrl} 
                        alt="Profile" 
                        fill
                        className="object-cover" 
                        sizes="96px"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-on-surface-variant" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-accent text-bg-base p-2 border-2 border-edge-neutral shadow-[4px_4px_0px_var(--color-edge-neutral)] pointer-events-none">
                    <Upload className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-ui-label text-xs uppercase tracking-widest font-bold text-ink-secondary mt-2">Upload Avatar</p>
              </div>

              <div className="mb-6">
                <label htmlFor="username" className="block font-ui-label text-xs uppercase tracking-widest font-bold text-ink-primary mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Satoshi"
                  maxLength={20}
                  className="w-full p-4 bg-bg-void border-2 border-edge-neutral font-mono-data text-ink-primary font-bold placeholder:text-ink-tertiary focus:outline-none focus:border-accent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full neopop-button-teal py-4 font-ui-label text-sm font-bold uppercase tracking-widest"
              >
                Save Changes
              </button>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

