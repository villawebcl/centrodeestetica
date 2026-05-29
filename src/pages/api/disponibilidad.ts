export const prerender = false;
import type { APIRoute } from "astro";
import { getClientIp, isRateLimited, json, PUBLIC_SHORT_CACHE_HEADERS } from "@lib/api";
import { supabase } from "@lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  const ip = getClientIp(request);
  if (await isRateLimited(`disponibilidad:${ip}`, 60, 60 * 1000)) {
    return json({ error: "Demasiadas solicitudes." }, 429);
  }

  const fecha = url.searchParams.get("fecha");
  const profesional = url.searchParams.get("profesional");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !profesional?.trim()) {
    return json({ error: "Parámetros inválidos." }, 400);
  }

  try {
    const { data, error } = await supabase.rpc("get_booked_slots", {
      p_fecha: fecha,
      p_profesional_nombre: profesional.trim()
    });

    if (error) return json({ error: "Error al consultar disponibilidad." }, 500);

    // Normalize "HH:MM:SS" → "HH:MM" for comparison with form slots
    const booked = ((data ?? []) as Array<{ hora: string }>).map((r) => String(r.hora).slice(0, 5));
    return json({ booked }, 200, PUBLIC_SHORT_CACHE_HEADERS);
  } catch {
    return json({ error: "Error interno." }, 500);
  }
};
