import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, DynaPuff } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "@/providers/convex-provider";
import { AuthProvider } from "@/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/theme-context";

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
  title: "Dump — The context dump for humans and AI",
  description:
    "Shared whiteboards of links and text, accessible to all agents and chatbots.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.get-dump.com"
  ),
  openGraph: {
    title: "Dump — The context dump for humans and AI",
    description:
      "Shared whiteboards of links and text, accessible to all agents and chatbots.",
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
    title: "Dump — The context dump for humans and AI",
    description:
      "Shared whiteboards of links and text, accessible to all agents and chatbots.",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dynaPuff.variable} antialiased`}
      >
        <ConvexProvider>
          <AuthProvider>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
