"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const { isAuthenticated: convexAuthenticated } = useConvexAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const syncedUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setFirebaseLoading(false);
      if (!firebaseUser) {
        syncedUid.current = null;
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync user to Convex only after Convex auth is ready
  useEffect(() => {
    if (!convexAuthenticated || !user) return;
    if (syncedUid.current === user.uid) return;
    syncedUid.current = user.uid;

    getOrCreateUser({
      firebaseUid: user.uid,
      email: user.email ?? "",
      name: user.displayName ?? "",
      profileImage: user.photoURL ?? undefined,
    }).catch(() => {
      // Reset so it retries on next render
      syncedUid.current = null;
    });
  }, [convexAuthenticated, user, getOrCreateUser]);

  const loading = firebaseLoading || (!!user && !convexAuthenticated);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
