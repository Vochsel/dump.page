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
  const body = await req.formData().catch(() => null);
  const json = body ? null : await req.json().catch(() => null);

  const getParam = (key: string): string | undefined => {
    if (body) return body.get(key)?.toString();
    if (json) return json[key];
    return undefined;
  };

  const grantType = getParam("grant_type");

  if (grantType === "authorization_code") {
    const code = getParam("code");
    const clientId = getParam("client_id");
    const codeVerifier = getParam("code_verifier");
    const redirectUri = getParam("redirect_uri");

    if (!code || !clientId || !codeVerifier || !redirectUri) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing required parameters" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await convex.mutation(api.mcpAuth.exchangeAuthCode, {
      code,
      clientId,
      codeVerifier,
      redirectUri,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });
  }

  if (grantType === "refresh_token") {
    const refreshToken = getParam("refresh_token");
    const clientId = getParam("client_id");

    if (!refreshToken || !clientId) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await convex.mutation(api.mcpAuth.refreshAccessToken, {
      refreshToken,
      clientId,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });
  }

  return NextResponse.json(
    { error: "unsupported_grant_type" },
    { status: 400, headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
