import {
  customQuery,
  customMutation,
  customCtx,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { getCurrentUser, requireUser, ensureUser } from "./auth";

/**
 * Query that requires authentication. ctx.user is guaranteed.
 */
export const authedQuery = customQuery(query, customCtx(async (ctx) => {
  const user = await requireUser(ctx);
  return { user };
}));

/**
 * Mutation that requires authentication. ctx.user is guaranteed.
 */
export const authedMutation = customMutation(mutation, customCtx(async (ctx) => {
  const user = await requireUser(ctx);
  return { user };
}));

/**
 * Mutation that ensures the user record exists (creates if needed).
 * Use for entry points where new users may not have a record yet.
 */
export const ensuredMutation = customMutation(mutation, customCtx(async (ctx) => {
  const user = await ensureUser(ctx);
  return { user };
}));
