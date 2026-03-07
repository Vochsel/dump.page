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
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: corsHeaders }
    );
  }

  const clientName = body.client_name || "Unknown Client";
  const redirectUris = body.redirect_uris || [];

  if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate redirect URIs: must be HTTPS or localhost
  for (const uri of redirectUris) {
    try {
      const url = new URL(uri);
      const isLocalhost =
        url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (!isLocalhost && url.protocol !== "https:") {
        return NextResponse.json(
          {
            error: "invalid_redirect_uri",
            error_description: "Redirect URIs must use HTTPS or localhost",
          },
          { status: 400, headers: corsHeaders }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  const result = await convex.mutation(api.mcpAuth.registerClient, {
    clientName,
    redirectUris,
  });

  return NextResponse.json(result, { status: 201, headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
