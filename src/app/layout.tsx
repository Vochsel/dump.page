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
  title: "Dump",
  description: "Collaborative context boards for teams",
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
