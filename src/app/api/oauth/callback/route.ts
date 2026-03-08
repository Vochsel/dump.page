import { NextRequest, NextResponse } from "next/server";
import { internal } from "../../../../../convex/_generated/api";
import { getAdminAuth } from "@/lib/firebase-admin";
import { adminQuery, adminMutation } from "@/lib/convex-server";

const ALLOWED_SCOPES = new Set(["read", "write"]);

// This endpoint is called by the authorize page after Firebase auth
// It validates the Firebase ID token and creates an OAuth auth code
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[OAuth Callback] POST");

  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const {
    idToken,
    clientId,
    redirectUri,
    codeChallenge,
    scope,
    state,
  } = body;

  console.log("[OAuth Callback] params:", { hasIdToken: !!idToken, clientId, redirectUri, hasCodeChallenge: !!codeChallenge, scope, state: state?.slice(0, 20) });

  if (!idToken || !clientId || !redirectUri || !codeChallenge) {
    console.log("[OAuth Callback] Missing required params");
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Verify Firebase ID token server-side
  let firebaseUid: string;
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    firebaseUid = decodedToken.uid;
  } catch (err) {
    console.error("[OAuth Callback] ID token verification failed:", err);
    return NextResponse.json(
      { error: "Invalid or expired authentication token" },
      { status: 401 }
    );
  }

  // Look up user by verified Firebase UID
  const user = await adminQuery(internal.mcpAuth.getUserByFirebaseUid, {
    firebaseUid,
  });

  console.log("[OAuth Callback] user lookup:", user ? "found" : "not found");

  if (!user) {
    return NextResponse.json(
      { error: "User not found. Please sign in to Dump first." },
      { status: 404 }
    );
  }

  // Validate client_id if registered
  const client = await adminQuery(internal.mcpAuth.getClient, { clientId });
  console.log("[OAuth Callback] client lookup:", client ? "registered" : "unregistered (allowing)");

  if (client) {
    if (!client.redirectUris.includes(redirectUri)) {
      console.log("[OAuth Callback] Invalid redirect_uri");
      return NextResponse.json(
        { error: "Invalid redirect_uri for this client" },
        { status: 400 }
      );
    }
  }

  // Whitelist scopes — filter out unknown scopes
  const requestedScopes = (scope || "read").split(/[\s,]+/).filter(Boolean);
  const validScopes = requestedScopes.filter((s: string) => ALLOWED_SCOPES.has(s));
  if (validScopes.length === 0) {
    validScopes.push("read");
  }
  const validatedScope = validScopes.join(" ");

  // Create auth code
  const code = await adminMutation(internal.mcpAuth.createAuthCode, {
    userId: user._id,
    clientId,
    redirectUri,
    codeChallenge,
    scope: validatedScope,
  });

  // Build redirect URL
  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  console.log("[OAuth Callback] Created auth code, redirecting to:", redirect.origin + redirect.pathname);

  return NextResponse.json({ redirectUrl: redirect.toString() });
}
