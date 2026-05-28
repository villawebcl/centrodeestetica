export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return await isAdminSessionValid(cookies);
}

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

function sanitize(raw: Record<string, unknown>) {
  const color_primario   = cleanString(raw.color_primario, 7);
  const color_secundario = cleanString(raw.color_secundario, 7);
  return {
    nombre_negocio:  cleanString(raw.nombre_negocio,  120),
    tagline:         cleanString(raw.tagline,          200),
    descripcion:     cleanString(raw.descripcion,      700),
    direccion:       cleanString(raw.direccion,        200),
    horarios:        cleanString(raw.horarios,         200),
    email:           cleanString(raw.email,            120),
    telefono:        cleanString(raw.telefono,          30),
    whatsapp_number: cleanString(raw.whatsapp_number,   30),
    color_primario:   hexColorRegex.test(color_primario)   ? color_primario   : "#000000",
    color_secundario: hexColorRegex.test(color_secundario) ? color_secundario : "#ffffff",
  };
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("configuracion").select("*").single();
  if (error) return json({ error: error.message }, 500);
  return json({ data });
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const payload = sanitize(await request.json());
  if (!payload.nombre_negocio) return json({ error: "El nombre del negocio es obligatorio." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("configuracion").update(payload).eq("id", 1).select("id");
  if (error) return json({ error: error.message }, 500);
  return json({ data, updated: data?.length ?? 0 });
};
