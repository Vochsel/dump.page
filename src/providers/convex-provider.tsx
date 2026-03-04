"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null;
      return await user.getIdToken(forceRefreshToken);
    },
    [user]
  );

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken]
  );
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
