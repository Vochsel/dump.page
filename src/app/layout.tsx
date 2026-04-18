import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Poppins, DynaPuff } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "@/providers/convex-provider";
import { AuthProvider } from "@/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/theme-context";
import { CommandPalette } from "@/components/CommandPalette";
import { createMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dynaPuff = DynaPuff({
  variable: "--font-dynapuff",
  subsets: ["latin"],
});

export const metadata: Metadata = createMetadata({
  title: "Dump | Share project context between ChatGPT, Claude, and your team",
  description:
    "Dump is a collaborative context board for links, notes, checklists, and project briefs. Share one source of truth with ChatGPT, Claude, coding agents, and humans.",
  path: "/",
  keywords: [
    "share projects between ChatGPT and Claude",
    "shared project brief for AI",
    "AI project handoff",
    "shared context for coding agents",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dynaPuff.variable} antialiased`}
      >
        <ConvexProvider>
          <AuthProvider>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <CommandPalette />
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
