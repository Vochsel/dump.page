"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <Button onClick={signInWithGoogle} size="lg" className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
