export const prerender = false;
import type { APIRoute } from "astro";
import { cleanString, getClientIp, isRateLimited, json } from "@lib/api";
import { supabase } from "@lib/supabase";

const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(raw: Record<string, unknown>) {
  return {
    nombre: cleanString(raw.name, 90),
    telefono: cleanString(raw.phone, 30),
    email: cleanString(raw.email, 120),
    servicio: cleanString(raw.service, 120),
    mensaje: cleanString(raw.message, 900),
    consent: raw.consent === true || raw.consent === "true" || raw.consent === "on",
    origen: "contacto"
  };
}

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  if (await isRateLimited(`contacto:${ip}`, 5, 10 * 60 * 1000)) {
    return json({ error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." }, 429);
  }

  try {
    const payload = sanitize(await request.json());
    if (!payload.nombre || !payload.mensaje) {
      return json({ error: "Nombre y mensaje son obligatorios." }, 400);
    }
    if (!payload.consent) {
      return json({ error: "Debes aceptar la politica de privacidad para enviar tu consulta." }, 400);
    }
    if (payload.telefono && !phoneRegex.test(payload.telefono)) {
      return json({ error: "Telefono invalido." }, 400);
    }
    if (payload.email && !emailRegex.test(payload.email)) {
      return json({ error: "Email invalido." }, 400);
    }
    if (!payload.telefono && !payload.email) {
      return json({ error: "Indica telefono o email para responderte." }, 400);
    }

    const lead = {
      nombre: payload.nombre,
      telefono: payload.telefono,
      email: payload.email,
      servicio: payload.servicio,
      mensaje: payload.mensaje,
      origen: payload.origen
    };
    const { error } = await supabase.from("contacto_leads").insert([lead]);
    if (error) return json({ error: "No se pudo registrar el contacto." }, 500);

    return json({ ok: true }, 201);
  } catch {
    return json({ error: "Error interno." }, 500);
  }
};
