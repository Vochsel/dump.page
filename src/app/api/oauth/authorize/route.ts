import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const state = params.get("state");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method") || "S256";
  const responseType = params.get("response_type");

  if (responseType !== "code") {
    return NextResponse.json(
      { error: "unsupported_response_type" },
      { status: 400 }
    );
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Store OAuth params in a cookie so we can retrieve them in the callback
  const oauthState = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("mcp_oauth_params", JSON.stringify({
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
    oauthState,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Redirect to Google OAuth
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return NextResponse.json(
      { error: "server_error", error_description: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", googleClientId);
  googleAuthUrl.searchParams.set("redirect_uri", `${origin}/api/oauth/callback`);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", oauthState);
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(googleAuthUrl.toString());
}
