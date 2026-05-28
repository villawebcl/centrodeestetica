export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { sanitizeServicePayload, validateServicePayload } from "@lib/adminPayloads";
import { logAudit } from "@lib/audit";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return await isAdminSessionValid(cookies);
}

function getSupabaseAdmin() {
  return createSupabaseAdminClient();
}

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!(await requireAdmin(cookies))) {
    return json({ error: "No autorizado" }, 401);
  }

  try {
    const supabase = getSupabaseAdmin();
    const id = url.searchParams.get("id");

    if (id) {
      const { data, error } = await supabase.from("servicios").select("*").eq("id", id).single();
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }

    const query = supabase.from("servicios").select("*").order("nombre").order("id");
    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado" }, 500);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) {
    return json({ error: "No autorizado" }, 401);
  }
  if (!assertSameOrigin(request, new URL(request.url))) {
    return json({ error: "Origen no permitido" }, 403);
  }

  try {
    const payload = sanitizeServicePayload(await request.json());
    const validationError = validateServicePayload(payload);
    if (validationError) return json({ error: validationError }, 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("servicios")
      .insert([payload])
      .select("*")
      .single();

    if (error) return json({ error: error.message }, 500);
    await logAudit({ action: "create", entity: "servicios", entityId: data.id, details: payload });

    return json({ data }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado" }, 500);
  }
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) {
    return json({ error: "No autorizado" }, 401);
  }
  if (!assertSameOrigin(request, new URL(request.url))) {
    return json({ error: "Origen no permitido" }, 403);
  }

  try {
    const body = await request.json();
    const { id, nombre, originalNombre } = body;
    const payload =
      body.payload && Object.prototype.hasOwnProperty.call(body.payload, "activo")
        ? { activo: Boolean(body.payload.activo) }
        : sanitizeServicePayload(body.payload || {});
    if (!("activo" in payload)) {
      const validationError = validateServicePayload(payload);
      if (validationError) return json({ error: validationError }, 400);
    }
    const supabase = getSupabaseAdmin();

    let query = supabase.from("servicios").update(payload).select("id");
    const serviceName = cleanString(originalNombre || nombre, 90);
    if (serviceName) {
      query = query.eq("nombre", serviceName);
    } else if (id) {
      query = query.eq("id", id);
    } else {
      return json({ error: "Falta identificar el servicio." }, 400);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);
    if (!data || data.length === 0) {
      return json({ error: "No se actualizó ningún servicio." }, 409);
    }
    await logAudit({ action: "update", entity: "servicios", entityId: String(data[0]?.id ?? id ?? serviceName), details: payload });

    return json({ data, updated: data.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado" }, 500);
  }
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) {
    return json({ error: "No autorizado" }, 401);
  }
  if (!assertSameOrigin(request, new URL(request.url))) {
    return json({ error: "Origen no permitido" }, 403);
  }

  try {
    const { nombre, id } = await request.json();
    const supabase = getSupabaseAdmin();

    let query = supabase.from("servicios").delete().select("id");
    const serviceName = cleanString(nombre, 90);
    if (serviceName) {
      query = query.eq("nombre", serviceName);
    } else if (id) {
      query = query.eq("id", id);
    } else {
      return json({ error: "Falta identificar el servicio." }, 400);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);
    await logAudit({ action: "delete", entity: "servicios", entityId: String(data?.[0]?.id ?? id ?? serviceName), details: { nombre: serviceName } });

    return json({ data, deleted: data?.length ?? 0 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado" }, 500);
  }
};
