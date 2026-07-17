import { LandingNav } from "@/components/layout/LandingNav";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-ui-label selection:bg-accent selection:text-bg-base">
      <LandingNav />
      
      <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
        <h1 className="font-headline-lg text-4xl md:text-6xl font-extrabold uppercase tracking-tighter text-ink-primary mb-8 border-l-4 border-accent pl-6">
          Privacy Policy
        </h1>
        
        <div className="space-y-8 text-ink-secondary text-base md:text-lg leading-relaxed font-ui-label">
          <section>
            <p className="font-bold text-ink-primary mb-4">Last Updated: June 30, 2026</p>
            <p>
              Your privacy is critically important to us. This Privacy Policy explains how TrustLance collects, uses, and protects your information.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">1. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 marker:text-accent">
              <li><strong>Wallet Addresses:</strong> Used to authenticate and identify you on the platform.</li>
              <li><strong>GitHub Activity:</strong> When you link GitHub for contract fulfillment, we read pull request status to trigger payouts.</li>
              <li><strong>Usage Analytics:</strong> Anonymous telemetry (if enabled) to help us improve the platform.</li>
            </ul>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">2. Blockchain Transparency</h2>
            <p>
              Due to the public nature of the Stellar blockchain, any transactions you make (such as funding an escrow or receiving a payout) are public and permanent. This data is not controlled by TrustLance.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">3. Third-Party Services</h2>
            <p>
              We use third-party infrastructure including Firebase (for off-chain metadata) and Stellar Horizon nodes (for blockchain indexing). These services have their own privacy policies governing data processing.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">4. Your Rights</h2>
            <p>
              Since we operate on a decentralized identity model (your wallet), we do not store traditional personal data (like names or emails) unless you explicitly provide them for notifications. You can disconnect your wallet at any time.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
