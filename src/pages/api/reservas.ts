export const prerender = false;
import type { APIRoute } from "astro";
import { getClientIp, isRateLimited, json } from "@lib/api";
import { createPublicReservation, sanitizeBookingPayload } from "@lib/booking";
import { supabase } from "@lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  if (await isRateLimited(`reservas:${ip}`, 5, 10 * 60 * 1000)) {
    return json({ error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." }, 429);
  }

  try {
    const body = await request.json();
    const result = await createPublicReservation(supabase, sanitizeBookingPayload(body));
    if (!result.ok) return json({ error: result.error }, result.status);

    return json({ ok: true }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
};
