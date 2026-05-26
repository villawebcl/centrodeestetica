import type { APIContext, AstroCookies } from "astro";

const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

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

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
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
  if (!origin) return true;

  try {
    return new URL(origin).origin === siteUrl.origin;
  } catch {
    return false;
  }
}
