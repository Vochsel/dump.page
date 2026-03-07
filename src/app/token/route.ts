import { NextRequest } from "next/server";
import { POST as tokenPost, OPTIONS as tokenOptions } from "../api/oauth/token/route";

export function POST(req: NextRequest) {
  return tokenPost(req);
}

export function OPTIONS() {
  return tokenOptions();
}
