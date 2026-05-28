export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return await isAdminSessionValid(cookies);
}

function sanitize(raw: Record<string, unknown>) {
  return {
    nombre:      cleanString(raw.nombre,      90),
    rol:         cleanString(raw.rol,         60),
    especialidad: cleanString(raw.especialidad, 120),
    bio:         cleanString(raw.bio,         700),
  };
}

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);

  const supabase = createSupabaseAdminClient();
  const id = url.searchParams.get("id");

  if (id) {
    const { data, error } = await supabase.from("profesionales").select("*").eq("id", id).single();
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  const { data, error } = await supabase.from("profesionales").select("*").order("nombre");
  if (error) return json({ error: error.message }, 500);
  return json({ data });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const payload = sanitize(await request.json());
  if (!payload.nombre) return json({ error: "El nombre es obligatorio." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("profesionales").insert([payload]).select("*").single();
  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Falta el id del profesional." }, 400);

  const payload =
    body.payload && Object.prototype.hasOwnProperty.call(body.payload, "activo")
      ? { activo: Boolean(body.payload.activo) }
      : sanitize(body.payload || {});

  if (!("activo" in payload) && !payload.nombre) {
    return json({ error: "El nombre es obligatorio." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("profesionales").update(payload).eq("id", id).select("id");
  if (error) return json({ error: error.message }, 500);
  if (!data?.length) return json({ error: "No se encontró el profesional." }, 409);
  return json({ data, updated: data.length });
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const { id } = await request.json();
  if (!id) return json({ error: "Falta el id del profesional." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("profesionales").delete().eq("id", id).select("id");
  if (error) return json({ error: error.message }, 500);
  return json({ data, deleted: data?.length ?? 0 });
};
