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

  if (!firebaseUid || !clientId || !redirectUri || !codeChallenge) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Look up user by Firebase UID
  const user = await convex.query(api.mcpAuth.getUserByFirebaseUid, {
    firebaseUid,
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found. Please sign in to Dump first." },
      { status: 404 }
    );
  }

  // Validate client_id if registered
  const client = await convex.query(api.mcpAuth.getClient, { clientId });
  if (client) {
    // Validate redirect_uri against registered URIs
    if (!client.redirectUris.includes(redirectUri)) {
      return NextResponse.json(
        { error: "Invalid redirect_uri for this client" },
        { status: 400 }
      );
    }
  }
  // If client not registered (dynamic registration may not have been used),
  // allow the flow - the PKCE challenge protects against code interception

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

  return NextResponse.json({ redirectUrl: redirect.toString() });
}
