import { describe, expect, it, vi } from "vitest";
import { cleanString, createMemoryRateLimiter, getClientIp, json, PUBLIC_SHORT_CACHE_HEADERS } from "../../src/lib/api";
import { sanitizeBookingPayload, validateBookingPayload } from "../../src/lib/booking";

describe("api helpers", () => {
  it("cleans strings safely", () => {
    expect(cleanString("  abcdef  ", 3)).toBe("abc");
    expect(cleanString(null, 10)).toBe("");
  });

  it("rate limits in a fixed window", () => {
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const limiter = createMemoryRateLimiter();

    expect(limiter("ip:1", 2, 1_000)).toBe(false);
    expect(limiter("ip:1", 2, 1_000)).toBe(false);
    expect(limiter("ip:1", 2, 1_000)).toBe(true);

    vi.setSystemTime(new Date("2026-01-01T10:00:02Z"));
    expect(limiter("ip:1", 2, 1_000)).toBe(false);
    vi.useRealTimers();
  });

  it("returns json responses with overrideable cache headers", async () => {
    const response = json({ ok: true }, 202, PUBLIC_SHORT_CACHE_HEADERS);

    expect(response.status).toBe(202);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toContain("s-maxage=30");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("reads client ip from proxy headers", () => {
    const request = new Request("https://site.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" }
    });

    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("sanitizes booking payloads", () => {
    const payload = sanitizeBookingPayload(
      {
        name: "  Cliente  ",
        phone: "+56 9 1234 5678",
        service: "Facial",
        professional: "Ana",
        date: "2026-06-01",
        time: "10:00",
        notes: "x".repeat(900),
        consent: true
      },
      new Date("2026-05-28T12:00:00Z")
    );

    expect(payload.cliente_nombre).toBe("Cliente");
    expect(payload.notas).toHaveLength(700);
    expect(validateBookingPayload(payload)).toBeNull();
  });
});
