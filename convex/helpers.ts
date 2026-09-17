import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Cryptographic hash for passwords in Convex V8 runtime
export async function hashPassword(password: string, salt: string = "ldr_companion_salt"): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ":" + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "LDR-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getAuthUser(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<Doc<"users"> | null> {
  if (!token) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    return null;
  }

  return await ctx.db.get(session.userId);
}

export async function requireAuthUser(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<Doc<"users">> {
  const user = await getAuthUser(ctx, token);
  if (!user) {
    throw new Error("Unauthorized: Please log in first.");
  }
  return user;
}

export async function getActiveCoupleForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"couples"> | null> {
  const asUser1 = await ctx.db
    .query("couples")
    .withIndex("by_user1", (q) => q.eq("user1Id", userId))
    .first();

  if (asUser1) return asUser1;

  const asUser2 = await ctx.db
    .query("couples")
    .withIndex("by_user2", (q) => q.eq("user2Id", userId))
    .first();

  return asUser2;
}

export async function getAuthCouple(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<{
  user: Doc<"users">;
  couple: Doc<"couples">;
  partnerId: Id<"users"> | null;
} | null> {
  const user = await getAuthUser(ctx, token);
  if (!user) return null;

  const couple = await getActiveCoupleForUser(ctx, user._id);
  if (!couple) return null;

  const partnerId =
    couple.user1Id === user._id ? (couple.user2Id ?? null) : couple.user1Id;

  return { user, couple, partnerId };
}

export async function requireAuthCouple(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined
): Promise<{
  user: Doc<"users">;
  couple: Doc<"couples">;
  partnerId: Id<"users"> | null;
}> {
  const user = await requireAuthUser(ctx, token);
  const couple = await getActiveCoupleForUser(ctx, user._id);

  if (!couple) {
    throw new Error("No active relationship found. Please create or join one.");
  }

  const partnerId =
    couple.user1Id === user._id ? (couple.user2Id ?? null) : couple.user1Id;

  return { user, couple, partnerId };
}
