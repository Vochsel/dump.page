import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const googleCode = params.get("code");
  const googleState = params.get("state");
  const error = params.get("error");

  if (error) {
    return new Response(`Authorization denied: ${error}`, { status: 400 });
  }

  if (!googleCode || !googleState) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Retrieve stored OAuth params from cookie
  const cookieStore = await cookies();
  const paramsCookie = cookieStore.get("mcp_oauth_params");
  if (!paramsCookie) {
    return new Response("Session expired. Please try again.", { status: 400 });
  }

  const oauthParams = JSON.parse(paramsCookie.value);
  cookieStore.delete("mcp_oauth_params");

  // Verify state to prevent CSRF
  if (oauthParams.oauthState !== googleState) {
    return new Response("State mismatch", { status: 400 });
  }

  // Exchange Google auth code for tokens
  const origin = request.nextUrl.origin;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: googleCode,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/oauth/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return new Response("Failed to exchange Google auth code", { status: 500 });
  }

  const tokens = await tokenResponse.json();

  // Get user info from Google
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );

  if (!userInfoResponse.ok) {
    return new Response("Failed to get user info", { status: 500 });
  }

  const userInfo = await userInfoResponse.json();
  const email: string = userInfo.email;

  // Look up user in Convex by email
  const user = await convex.query(api.mcp.getUserByEmail, { email });
  if (!user) {
    return new Response(
      "No Magpai account found for this email. Please sign up at the app first.",
      { status: 403 }
    );
  }

  // Generate auth code
  const authCode = crypto.randomUUID();
  await convex.mutation(api.mcp.createAuthCode, {
    code: authCode,
    clientId: oauthParams.clientId,
    userId: user._id as Id<"users">,
    codeChallenge: oauthParams.codeChallenge,
    codeChallengeMethod: oauthParams.codeChallengeMethod,
    redirectUri: oauthParams.redirectUri,
  });

  // Redirect back to MCP client with auth code
  const redirectUrl = new URL(oauthParams.redirectUri);
  redirectUrl.searchParams.set("code", authCode);
  if (oauthParams.state) {
    redirectUrl.searchParams.set("state", oauthParams.state);
  }

  return NextResponse.redirect(redirectUrl.toString());
}
