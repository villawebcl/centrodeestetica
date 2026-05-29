import type { APIContext, AstroCookies } from "astro";

const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PBKDF2_ITERATIONS = 100_000;

function getSecret() {
  const secret = import.meta.env.ADMIN_SESSION_SECRET || import.meta.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET o ADMIN_PASSWORD.");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer) {
  const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256
  );
  return `${bytesToHex(salt.buffer)}:${bytesToHex(derived)}`;
}

export async function verifyHashedPassword(password: string, stored: string): Promise<boolean> {
  const idx = stored.indexOf(":");
  if (idx < 1) return false;
  try {
    const salt = hexToBytes(stored.slice(0, idx));
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256
    );
    return safeEqual(bytesToHex(derived), stored.slice(idx + 1));
  } catch {
    return false;
  }
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(signature);
}

export async function createAdminSessionValue() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = String(issuedAt);
  return `${body}.${await sign(body)}`;
}

export async function isAdminSessionValid(cookies: AstroCookies) {
  const value = cookies.get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  const [issuedAtRaw, signature] = value.split(".");
  if (!issuedAtRaw || !signature) return false;
  if (!safeEqual(await sign(issuedAtRaw), signature)) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const age = Math.floor(Date.now() / 1000) - issuedAt;
  return age >= 0 && age <= SESSION_TTL_SECONDS;
}

export async function setAdminSessionCookie(context: Pick<APIContext, "cookies" | "url">) {
  context.cookies.set(ADMIN_COOKIE, await createAdminSessionValue(), {
    path: "/",
    httpOnly: true,
    secure: context.url.protocol === "https:",
    sameSite: "strict",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function refreshAdminSessionCookie(context: Pick<APIContext, "cookies" | "url">) {
  if (await isAdminSessionValid(context.cookies)) {
    await setAdminSessionCookie(context);
    return true;
  }

  return false;
}

export function clearAdminSessionCookie(context: Pick<APIContext, "cookies" | "url">) {
  context.cookies.delete(ADMIN_COOKIE, {
    path: "/",
    httpOnly: true,
    secure: context.url.protocol === "https:",
    sameSite: "strict"
  });
}

export function assertSameOrigin(request: Request, siteUrl: URL) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === siteUrl.origin;
  } catch {
    return false;
  }
}
