export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return await isAdminSessionValid(cookies);
}

function sanitize(raw: Record<string, unknown>) {
  const incluyeRaw = raw.incluye;
  const incluye: string[] = Array.isArray(incluyeRaw)
    ? incluyeRaw.map((i) => cleanString(i, 200)).filter(Boolean)
    : typeof incluyeRaw === "string"
      ? incluyeRaw.split("\n").map((i) => cleanString(i, 200)).filter(Boolean)
      : [];

  return {
    nombre:       cleanString(raw.nombre,       90),
    precio:       cleanString(raw.precio,       40),
    precio_antes: cleanString(raw.precio_antes, 40),
    tag:          cleanString(raw.tag,          60),
    descripcion:  cleanString(raw.descripcion,  700),
    incluye,
  };
}

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);

  const supabase = createSupabaseAdminClient();
  const id = url.searchParams.get("id");

  if (id) {
    const { data, error } = await supabase.from("promociones").select("*").eq("id", id).single();
    if (error) return json({ error: error.message }, 500);
    return json({ data });
  }

  const { data, error } = await supabase.from("promociones").select("*").order("nombre");
  if (error) return json({ error: error.message }, 500);
  return json({ data });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const payload = sanitize(await request.json());
  if (!payload.nombre) return json({ error: "El nombre es obligatorio." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("promociones").insert([payload]).select("*").single();
  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const body = await request.json();
  const { id } = body;
  if (!id) return json({ error: "Falta el id de la promoción." }, 400);

  const payload =
    body.payload && Object.prototype.hasOwnProperty.call(body.payload, "activo")
      ? { activo: Boolean(body.payload.activo) }
      : sanitize(body.payload || {});

  if (!("activo" in payload) && !payload.nombre) {
    return json({ error: "El nombre es obligatorio." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("promociones").update(payload).eq("id", id).select("id");
  if (error) return json({ error: error.message }, 500);
  if (!data?.length) return json({ error: "No se encontró la promoción." }, 409);
  return json({ data, updated: data.length });
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const { id } = await request.json();
  if (!id) return json({ error: "Falta el id de la promoción." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("promociones").delete().eq("id", id).select("id");
  if (error) return json({ error: error.message }, 500);
  return json({ data, deleted: data?.length ?? 0 });
};
