import { describe, expect, it } from "vitest";
import { createPublicReservation, sanitizeBookingPayload } from "../../src/lib/booking";

function booking(overrides: Record<string, unknown> = {}) {
  return sanitizeBookingPayload(
    {
      name: "Cliente Test",
      phone: "+56 9 1234 5678",
      service: "Limpieza facial",
      professional: "Ana",
      date: "2026-06-01",
      time: "10:00",
      notes: "",
      consent: true,
      ...overrides
    },
    new Date("2026-05-28T12:00:00Z")
  );
}

describe("reservation flow", () => {
  it("creates a reservation through the public RPC", async () => {
    const calls: unknown[] = [];
    const supabase = {
      rpc: async (_name: string, params: Record<string, string | null>) => {
        calls.push(params);
        return { error: null };
      }
    };

    await expect(createPublicReservation(supabase, booking())).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(1);
  });

  it("rejects invalid payloads before calling Supabase", async () => {
    const supabase = {
      rpc: async () => {
        throw new Error("should not be called");
      }
    };

    await expect(createPublicReservation(supabase, booking({ phone: "123", time: "99:99" }))).resolves.toMatchObject({
      ok: false,
      status: 400
    });
  });

  it("maps double booking conflicts to 409", async () => {
    const supabase = {
      rpc: async () => ({ error: { message: "slot_unavailable" } })
    };

    await expect(createPublicReservation(supabase, booking())).resolves.toMatchObject({
      ok: false,
      status: 409
    });
  });
});
