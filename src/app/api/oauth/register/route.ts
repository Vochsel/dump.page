import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { redirect_uris, client_name } = body;

  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris required" },
      { status: 400 }
    );
  }

  const clientId = crypto.randomUUID();
  const clientSecret = crypto.randomUUID();

  await convex.mutation(api.mcp.registerClient, {
    clientId,
    clientSecret,
    redirectUris: redirect_uris,
    clientName: client_name,
  });

  return NextResponse.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris,
      client_name,
      token_endpoint_auth_method: "client_secret_post",
    },
    {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
