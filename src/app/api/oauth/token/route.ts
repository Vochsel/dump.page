import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { createAccessToken } from "@/lib/oauth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: string
): Promise<boolean> {
  if (method !== "S256") return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64 === codeChallenge;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  let body: Record<string, string>;
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    body = Object.fromEntries(formData) as Record<string, string>;
  } else {
    body = await request.json();
  }

  const { grant_type, code, code_verifier, redirect_uri } = body;

  if (grant_type !== "authorization_code") {
    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 }
    );
  }

  if (!code || !code_verifier) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing code or code_verifier" },
      { status: 400 }
    );
  }

  // Look up and consume auth code
  const authCode = await convex.mutation(api.mcp.consumeAuthCode, { code });
  if (!authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid or expired authorization code" },
      { status: 400 }
    );
  }

  // Verify redirect_uri matches
  if (redirect_uri && redirect_uri !== authCode.redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Verify PKCE
  const pkceValid = await verifyPkce(
    code_verifier,
    authCode.codeChallenge,
    authCode.codeChallengeMethod
  );
  if (!pkceValid) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Create JWT access token with userId from the consumed auth code
  const accessToken = await createAccessToken(authCode.userId);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
      scope: "boards:read",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
