import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SECRET = process.env.AUTH_SECRET || "antojo-dev-secret-change-in-prod-9f2k4";
const COOKIE_NAME = "antojo_token";
const MAX_AGE_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuf = Buffer.from(hash, "hex");
    const testBuf = crypto.scryptSync(password, salt, 64);
    if (hashBuf.length !== testBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, testBuf);
  } catch {
    return false;
  }
}

export function createToken(userId: string, role: string): string {
  const payload = { uid: userId, role, exp: Date.now() + MAX_AGE_DAYS * 86400000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): { uid: string; role: string; exp: number } | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.uid } });
  return user;
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getAuthUser();
  if (!user) {
    const err = new Error("No autenticado");
    (err as any).status = 401;
    throw err;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const err = new Error("Sin permisos");
    (err as any).status = 403;
    throw err;
  }
  return user;
}

export function setAuthCookie(token: string): string {
  // Returns a Set-Cookie header value
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_DAYS * 86400}`,
  ];
  if (process.env.NODE_ENV === "production") attrs.push("Secure");
  return attrs.join("; ");
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function serializeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    role: u.role,
    avatarColor: u.avatarColor,
    city: u.city,
    provider: u.provider,
    verified: u.verified,
    profileId: u.customer?.id ?? u.driver?.id ?? u.restaurant?.id ?? null,
  };
}
