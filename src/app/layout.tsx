import type { Metadata } from "next";
import { Geist, Outfit, JetBrains_Mono, Anton, Hanken_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { InviteReceiver } from "@/components/InviteReceiver";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrustLance - Ship. Get Paid. No Trust Req.",
  description:
    "Decentralized escrow protocol for high-stakes freelance contracts. Built for architectural rigor and absolute payment certainty.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Removed Material Symbols */}
        {/* Blocking script — prevents flash of wrong theme before React hydrates */}
        <script
          id="theme-initializer"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${outfit.variable} ${jetBrainsMono.variable} ${anton.variable} ${hankenGrotesk.variable} ${inter.variable} antialiased`}
      >
        <PostHogProvider>
          <MotionProvider>
            <Toaster richColors position="top-right" />
            {children}
            <FeedbackWidget />
            <InviteReceiver />
            <Analytics />
            <SpeedInsights />
          </MotionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
