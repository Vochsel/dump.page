import { NextRequest } from "next/server";
import { POST as registerPost, OPTIONS as registerOptions } from "../api/oauth/register/route";

export function POST(req: NextRequest) {
  return registerPost(req);
}

export function OPTIONS() {
  return registerOptions();
}
