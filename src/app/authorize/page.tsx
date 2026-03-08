"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const codeChallengeMethod = searchParams.get("code_challenge_method") || "";
  const state = searchParams.get("state") || "";
  const scope = searchParams.get("scope") || "read";
  const responseType = searchParams.get("response_type") || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAuthorize = useCallback(async (firebaseUser: User) => {
    setAuthorizing(true);
    setError(null);

    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/oauth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          clientId,
          redirectUri,
          codeChallenge,
          scope,
          state,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authorization failed");
        setAuthorizing(false);
        return;
      }

      // Redirect back to the MCP client
      window.location.href = data.redirectUrl;
    } catch {
      setError("Failed to authorize. Please try again.");
      setAuthorizing(false);
    }
  }, [clientId, redirectUri, codeChallenge, scope, state]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setLoading(false);
    } catch {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  // Validation
  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Invalid Request</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Missing required OAuth parameters. Please try connecting again from your MCP client.
          </p>
        </div>
      </div>
    );
  }

  if (responseType && responseType !== "code") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Unsupported Response Type</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Only &quot;code&quot; response type is supported.
          </p>
        </div>
      </div>
    );
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Unsupported Challenge Method</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Only S256 code challenge method is supported.
          </p>
        </div>
      </div>
    );
  }

  const scopeList = scope.split(/[\s,]+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
        <div className="text-center mb-6">
          <img src="/dump.png" alt="Dump" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Connect to Dump
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            An application wants to access your Dump account
          </p>
        </div>

        <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Permissions requested:
          </h3>
          <ul className="space-y-1">
            {scopeList.includes("read") && (
              <li className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <span className="text-green-600">&#10003;</span>
                View your boards and items
              </li>
            )}
            {scopeList.includes("write") && (
              <li className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <span className="text-green-600">&#10003;</span>
                Create and edit notes on your boards
              </li>
            )}
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-neutral-500 py-4">Loading...</div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {user.displayName}
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAuthorize(user)}
              disabled={authorizing}
              className="w-full py-2.5 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
            >
              {authorizing ? "Authorizing..." : "Authorize Access"}
            </button>

            <button
              onClick={() => window.close()}
              className="w-full py-2 px-4 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full py-2.5 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        )}

        <p className="text-xs text-center text-neutral-400 mt-6">
          By authorizing, you allow this application to access your Dump data according to the permissions above.
        </p>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-neutral-500">Loading...</div>
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
