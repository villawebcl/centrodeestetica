export const prerender = false;
import type { APIRoute } from "astro";
import { getClientIp, isRateLimited, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

export const GET: APIRoute = async ({ request, url }) => {
  const ip = getClientIp(request);
  if (isRateLimited(`disponibilidad:${ip}`, 60, 60 * 1000)) {
    return json({ error: "Demasiadas solicitudes." }, 429);
  }

  const fecha = url.searchParams.get("fecha");
  const profesional = url.searchParams.get("profesional");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !profesional?.trim()) {
    return json({ error: "Parámetros inválidos." }, 400);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reservas")
      .select("hora")
      .eq("fecha", fecha)
      .eq("profesional_nombre", profesional.trim())
      .in("estado", ["pendiente", "confirmada"]);

    if (error) return json({ error: "Error al consultar disponibilidad." }, 500);

    // Normalize "HH:MM:SS" → "HH:MM" for comparison with form slots
    const booked = (data ?? []).map((r) => String(r.hora).slice(0, 5));
    return json({ booked });
  } catch {
    return json({ error: "Error interno." }, 500);
  }
};
