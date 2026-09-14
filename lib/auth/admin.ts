import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_session";
const DEFAULT_ADMIN_PASSWORD = "admin123";

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword() + "_salt_tracecv_auth";
}

/**
 * Creates an HMAC signature for the session value.
 */
async function sign(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies an HMAC signature.
 */
async function verify(value: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(value, secret);
  return expected === signature;
}

/**
 * Creates a signed token value for the admin session cookie.
 */
export async function createAdminSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const secret = getSecretKey();
  const signature = await sign(timestamp, secret);
  return `${timestamp}.${signature}`;
}

/**
 * Verifies if a given session token is valid and not expired (valid for 7 days).
 */
export async function verifyAdminSessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // 7 days expiration
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge) {
    return false;
  }

  const secret = getSecretKey();
  return verify(timestampStr, signature, secret);
}

/**
 * Checks if the request has an active valid admin session in server components/actions.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

/**
 * Verifies the password submitted during admin login.
 */
export function verifyAdminPassword(password: string): boolean {
  const correctPassword = getAdminPassword();
  return password.trim() === correctPassword.trim();
}

export { ADMIN_COOKIE_NAME };
