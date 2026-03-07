import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const rawBody = await req.clone().text();
  console.log("[OAuth Token] POST", { contentType, rawBody: rawBody.slice(0, 500) });

  const body = contentType.includes("form") ? new URLSearchParams(rawBody) : null;
  const json = !body ? (() => { try { return JSON.parse(rawBody); } catch { return null; } })() : null;

  // Support client_id/client_secret via HTTP Basic Auth (RFC 6749 Section 2.3.1)
  let basicClientId: string | undefined;
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const [id] = decoded.split(":");
      basicClientId = id;
      console.log("[OAuth Token] Basic auth client_id:", basicClientId);
    } catch {
      console.log("[OAuth Token] Failed to decode Basic auth header");
    }
  }

  const getParam = (key: string): string | undefined => {
    if (body) return body.get(key) ?? undefined;
    if (json) return json[key];
    // Fall back to Basic auth for client_id
    if (key === "client_id" && basicClientId) return basicClientId;
    return undefined;
  };

  const grantType = getParam("grant_type");
  console.log("[OAuth Token] grant_type:", grantType);

  if (grantType === "authorization_code") {
    const code = getParam("code");
    const clientId = getParam("client_id");
    const codeVerifier = getParam("code_verifier");
    const redirectUri = getParam("redirect_uri");

    console.log("[OAuth Token] authorization_code params:", {
      hasCode: !!code,
      clientId,
      hasCodeVerifier: !!codeVerifier,
      redirectUri,
    });

    if (!code || !clientId || !codeVerifier || !redirectUri) {
      console.log("[OAuth Token] Missing required params");
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing required parameters" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const result = await convex.mutation(api.mcpAuth.exchangeAuthCode, {
        code,
        clientId,
        codeVerifier,
        redirectUri,
      });

      console.log("[OAuth Token] exchangeAuthCode result:", "error" in result ? result : "success");

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(result, { headers: corsHeaders });
    } catch (err) {
      console.error("[OAuth Token] exchangeAuthCode threw:", err);
      return NextResponse.json(
        { error: "server_error", error_description: "Internal error during token exchange" },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  if (grantType === "refresh_token") {
    const refreshToken = getParam("refresh_token");
    const clientId = getParam("client_id");

    console.log("[OAuth Token] refresh_token params:", { hasRefreshToken: !!refreshToken, clientId });

    if (!refreshToken || !clientId) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const result = await convex.mutation(api.mcpAuth.refreshAccessToken, {
        refreshToken,
        clientId,
      });

      console.log("[OAuth Token] refreshAccessToken result:", "error" in result ? result : "success");

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(result, { headers: corsHeaders });
    } catch (err) {
      console.error("[OAuth Token] refreshAccessToken threw:", err);
      return NextResponse.json(
        { error: "server_error" },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  console.log("[OAuth Token] Unsupported grant_type:", grantType);
  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400, headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
