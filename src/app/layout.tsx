import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, DynaPuff } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "@/providers/convex-provider";
import { AuthProvider } from "@/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export const metadata: Metadata = {
  title: "Dump — Your team's context dump",
  description:
    "Dump links, notes & ideas into shared boards your team and AI tools can actually use.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://dump.magpai.app"
  ),
  openGraph: {
    title: "Dump — Your team's context dump",
    description:
      "Dump links, notes & ideas into shared boards your team and AI tools can actually use.",
    siteName: "Dump",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Dump — collaborative context boards for teams and AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dump — Your team's context dump",
    description:
      "Dump links, notes & ideas into shared boards your team and AI tools can actually use.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/dump.png",
    apple: "/dump.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dynaPuff.variable} antialiased`}
      >
        <ConvexProvider>
          <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
