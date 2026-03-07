import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

// This endpoint is called by the authorize page after Firebase auth
// It validates the Firebase ID token and creates an OAuth auth code
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[OAuth Callback] POST", { body: body ? { ...body, firebaseUid: body.firebaseUid ? "***" : undefined } : null });

  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const {
    firebaseUid,
    clientId,
    redirectUri,
    codeChallenge,
    scope,
    state,
  } = body;

  console.log("[OAuth Callback] params:", { hasFirebaseUid: !!firebaseUid, clientId, redirectUri, hasCodeChallenge: !!codeChallenge, scope, state: state?.slice(0, 20) });

  if (!firebaseUid || !clientId || !redirectUri || !codeChallenge) {
    console.log("[OAuth Callback] Missing required params");
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Look up user by Firebase UID
  const user = await convex.query(api.mcpAuth.getUserByFirebaseUid, {
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
  const client = await convex.query(api.mcpAuth.getClient, { clientId });
  console.log("[OAuth Callback] client lookup:", client ? "registered" : "unregistered (allowing)");

  if (client) {
    if (!client.redirectUris.includes(redirectUri)) {
      console.log("[OAuth Callback] Invalid redirect_uri. Registered:", client.redirectUris, "Got:", redirectUri);
      return NextResponse.json(
        { error: "Invalid redirect_uri for this client" },
        { status: 400 }
      );
    }
  }

  // Create auth code
  const code = await convex.mutation(api.mcpAuth.createAuthCode, {
    userId: user._id,
    clientId,
    redirectUri,
    codeChallenge,
    scope: scope || "read",
  });

  // Build redirect URL
  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  console.log("[OAuth Callback] Created auth code, redirecting to:", redirect.origin + redirect.pathname);

  return NextResponse.json({ redirectUrl: redirect.toString() });
}
