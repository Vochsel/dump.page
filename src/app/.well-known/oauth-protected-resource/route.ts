import { NextRequest, NextResponse } from "next/server";
import { getProtectedResourceMetadata } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const metadata = getProtectedResourceMetadata(origin);
  return NextResponse.json(metadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
