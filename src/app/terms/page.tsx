import { LandingNav } from "@/components/layout/LandingNav";
import { Footer } from "@/components/layout/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-ui-label selection:bg-accent selection:text-bg-base">
      <LandingNav />
      
      <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
        <h1 className="font-headline-lg text-4xl md:text-6xl font-extrabold uppercase tracking-tighter text-ink-primary mb-8 border-l-4 border-accent pl-6">
          Terms of Service
        </h1>
        
        <div className="space-y-8 text-ink-secondary text-base md:text-lg leading-relaxed font-ui-label">
          <section>
            <p className="font-bold text-ink-primary mb-4">Last Updated: June 30, 2026</p>
            <p>
              Welcome to TrustLance. By accessing or using our protocol, website, and services, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">1. The Protocol</h2>
            <p>
              TrustLance operates as a non-custodial, decentralized escrow protocol built on the Stellar network and Soroban smart contracts. We do not hold your funds, nor can we access them. All transactions are governed purely by the smart contract code deployed on the network.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">2. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 marker:text-accent">
              <li>You are solely responsible for securing your wallet credentials and seed phrases.</li>
              <li>You agree to use the platform only for lawful purposes.</li>
              <li>You understand that all smart contract interactions are final and cannot be reversed by TrustLance.</li>
            </ul>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">3. Fees and Gas</h2>
            <p>
              TrustLance charges zero platform fees. However, you are responsible for any Stellar network fees (gas) required to execute transactions, including deploying contracts, funding escrows, and claiming payouts.
            </p>
          </section>

          <section className="border-t-2 border-dashed border-edge-neutral pt-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-ink-primary mb-4">4. Dispute Resolution</h2>
            <p>
              Because TrustLance is a decentralized protocol, we do not mediate disputes between clients and freelancers. Funds are locked according to the cryptographic parameters agreed upon during contract deployment.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
