"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

// Client-side fallback redirect: if middleware cookie hasn't caught it yet
// (e.g. user just signed in on this page), redirect authenticated users to dashboard.
export function AuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return null;
}
