"use client";

import { useAuth } from "@/context/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Magpai Collab
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Create context boards. Add text and links. Share with your team
          or make them AI-readable.
        </p>
      </div>
      <LoginButton />
    </div>
  );
}
