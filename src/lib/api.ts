import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers
    }
  });
}

export const PUBLIC_SHORT_CACHE_HEADERS = {
  "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
  "cdn-cache-control": "public, s-maxage=30"
};

export const ADMIN_CACHE_LIST_HEADERS = {
  "cache-control": "private, max-age=0, must-revalidate"
};

export const ADMIN_CACHE_ITEM_HEADERS = {
  "cache-control": "private, max-age=60"
};

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function createMemoryRateLimiter(store = new Map<string, RateLimitEntry>()) {
  return (key: string, limit: number, windowMs: number) => {
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    current.count += 1;
    return current.count > limit;
  };
}

const isMemoryRateLimited = createMemoryRateLimiter(rateLimitStore);

export async function isRateLimited(key: string, limit: number, windowMs: number) {
  if (!import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
    return isMemoryRateLimited(key, limit, windowMs);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs
    });

    if (error) throw error;
    return Boolean(data);
  } catch (error) {
    console.error("Rate limit RPC failed; using in-memory fallback.", error);
    return isMemoryRateLimited(key, limit, windowMs);
  }
}

export function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
