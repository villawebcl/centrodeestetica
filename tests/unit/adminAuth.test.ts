import { describe, expect, it } from "vitest";
import {
  assertSameOrigin,
  createAdminSessionValue,
  hashPassword,
  isAdminSessionValid,
  isStrongPassword,
  safeEqual,
  verifyHashedPassword
} from "../../src/lib/adminAuth";

describe("adminAuth", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Clave-Segura1!");

    expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
    expect(await verifyHashedPassword("Clave-Segura1!", hash)).toBe(true);
    expect(await verifyHashedPassword("otra", hash)).toBe(false);
  });

  it("validates password strength", () => {
    expect(isStrongPassword("Clave-Segura1!")).toBe(true);
    expect(isStrongPassword("admin1234")).toBe(false);
    expect(isStrongPassword("SINNUMEROS!")).toBe(false);
  });

  it("validates signed session cookies", async () => {
    const value = await createAdminSessionValue();
    const cookies = {
      get: (name: string) => (name === "admin_session" ? { value } : undefined)
    };

    expect(await isAdminSessionValid(cookies as never)).toBe(true);
  });

  it("rejects tampered session cookies", async () => {
    const value = `${await createAdminSessionValue()}x`;
    const cookies = {
      get: (name: string) => (name === "admin_session" ? { value } : undefined)
    };

    expect(await isAdminSessionValid(cookies as never)).toBe(false);
  });

  it("compares safely and enforces same origin", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(assertSameOrigin(new Request("https://site.test/admin", { headers: { origin: "https://site.test" } }), new URL("https://site.test/admin"))).toBe(true);
    expect(assertSameOrigin(new Request("https://site.test/admin"), new URL("https://site.test/admin"))).toBe(false);
  });
});
