import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference, FunctionReturnType } from "convex/server";

// Admin-authenticated Convex client for server-side routes.
// Uses CONVEX_DEPLOY_KEY to authorize calls to internal functions.
// ConvexHttpClient.setAdminAuth() exists at runtime but is marked @internal
// in TypeScript types, so we cast through the private interface.

type AnyQueryRef = FunctionReference<"query", "public" | "internal">;
type AnyMutationRef = FunctionReference<"mutation", "public" | "internal">;

interface ConvexHttpClientWithAdmin extends ConvexHttpClient {
  setAdminAuth(token: string): void;
}

let _client: ConvexHttpClientWithAdmin | null = null;

function getAdminClient(): ConvexHttpClientWithAdmin {
  if (!_client) {
    _client = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL!
    ) as ConvexHttpClientWithAdmin;
    const deployKey = process.env.CONVEX_DEPLOY_KEY;
    if (deployKey) {
      _client.setAdminAuth(deployKey);
    }
  }
  return _client;
}

export async function adminQuery<F extends AnyQueryRef>(
  query: F,
  args: F extends FunctionReference<"query", "public" | "internal", infer Args> ? Args : never
): Promise<FunctionReturnType<F>> {
  const client = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (client as any).query(query, args);
}

export async function adminMutation<F extends AnyMutationRef>(
  mutation: F,
  args: F extends FunctionReference<"mutation", "public" | "internal", infer Args> ? Args : never
): Promise<FunctionReturnType<F>> {
  const client = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (client as any).mutation(mutation, args);
}
