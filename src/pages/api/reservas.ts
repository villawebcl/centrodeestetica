import type { APIRoute } from "astro";
import { cleanString, getClientIp, isRateLimited, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseFutureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date <= today ? null : value;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  if (isRateLimited(`reservas:${ip}`, 5, 10 * 60 * 1000)) {
    return json({ error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." }, 429);
  }

  try {
    const body = await request.json();
    const payload = {
      cliente_nombre: cleanString(body.name, 90),
      cliente_telefono: cleanString(body.phone, 30),
      servicio_nombre: cleanString(body.service, 120),
      profesional_nombre: cleanString(body.professional, 120),
      fecha: parseFutureDate(cleanString(body.date, 10)),
      hora: cleanString(body.time, 5),
      notas: cleanString(body.notes, 700),
      estado: "pendiente"
    };

    if (!payload.cliente_nombre || !phoneRegex.test(payload.cliente_telefono)) {
      return json({ error: "Nombre o telefono invalido." }, 400);
    }
    if (!payload.servicio_nombre || !payload.profesional_nombre || !payload.fecha || !timeRegex.test(payload.hora)) {
      return json({ error: "Datos de reserva invalidos." }, 400);
    }

    const supabase = createSupabaseAdminClient();
    const [{ data: services, error: servicesError }, { data: professionals, error: professionalsError }] =
      await Promise.all([
        supabase.from("servicios").select("nombre").eq("nombre", payload.servicio_nombre).eq("activo", true).limit(1),
        supabase.from("profesionales").select("nombre").eq("nombre", payload.profesional_nombre).eq("activo", true).limit(1)
      ]);

    if (servicesError || professionalsError) return json({ error: "No se pudo validar la reserva." }, 500);
    if (!services?.length || !professionals?.length) {
      return json({ error: "Servicio o profesional no disponible." }, 400);
    }

    const { error } = await supabase.from("reservas").insert([payload]);
    if (error) return json({ error: "No se pudo crear la reserva." }, 500);

    return json({ ok: true }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
};
