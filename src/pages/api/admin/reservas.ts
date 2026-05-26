export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

const allowedStatuses = new Set(["pendiente", "confirmada", "completada", "cancelada"]);

async function requireAdmin(cookies: Parameters<APIRoute>[0]["cookies"]) {
  return await isAdminSessionValid(cookies);
}

export const GET: APIRoute = async ({ cookies, url }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);

  try {
    const supabase = createSupabaseAdminClient();
    const mode = url.searchParams.get("mode");

    if (mode === "metrics") {
      const { data, error } = await supabase.from("reservas").select("estado");
      if (error) return json({ error: "No se pudieron cargar las metricas." }, 500);
      return json({ data });
    }

    let query = supabase.from("reservas").select("*");

    const estado     = cleanString(url.searchParams.get("estado"),     30);
    const fecha      = cleanString(url.searchParams.get("fecha"),      10);
    const desde      = cleanString(url.searchParams.get("desde"),      10);
    const hasta      = cleanString(url.searchParams.get("hasta"),      10);
    const profesional = cleanString(url.searchParams.get("profesional"), 100);
    const servicio   = cleanString(url.searchParams.get("servicio"),   100);
    const buscar     = cleanString(url.searchParams.get("buscar"),     100);
    const orden      = cleanString(url.searchParams.get("orden"),       20);

    if (estado && allowedStatuses.has(estado)) query = query.eq("estado", estado);
    if (fecha)       query = query.eq("fecha", fecha);
    if (!fecha && desde) query = query.gte("fecha", desde);
    if (!fecha && hasta) query = query.lte("fecha", hasta);
    if (profesional) query = query.eq("profesional_nombre", profesional);
    if (servicio)    query = query.eq("servicio_nombre", servicio);
    if (buscar) {
      // Strip PostgREST filter-syntax chars to prevent filter injection
      const safeBuscar = buscar.replace(/[,()%]/g, "");
      if (safeBuscar) query = query.or(
        `cliente_nombre.ilike.%${safeBuscar}%,cliente_telefono.ilike.%${safeBuscar}%`
      );
    }

    switch (orden) {
      case "antigua": query = query.order("creado_en", { ascending: true });  break;
      case "proxima": query = query.order("fecha", { ascending: true }).order("hora", { ascending: true }); break;
      case "lejana":  query = query.order("fecha", { ascending: false }).order("hora", { ascending: false }); break;
      default:        query = query.order("creado_en", { ascending: false }); break; // reciente
    }

    const { data, error } = await query;
    if (error) return json({ error: "No se pudieron cargar las reservas." }, 500);

    return json({ data });
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) {
    return json({ error: "Origen no permitido" }, 403);
  }

  try {
    const { id, estado } = await request.json();
    const cleanEstado = cleanString(estado, 30);
    if (!id || !allowedStatuses.has(cleanEstado)) {
      return json({ error: "Estado de reserva invalido." }, 400);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reservas")
      .update({ estado: cleanEstado })
      .eq("id", id)
      .select("id")
      .single();

    if (error) return json({ error: "No se pudo actualizar la reserva." }, 500);
    return json({ data });
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  if (!(await requireAdmin(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) {
    return json({ error: "Origen no permitido" }, 403);
  }

  try {
    const { id } = await request.json();
    if (!id) return json({ error: "Falta identificar la reserva." }, 400);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) return json({ error: "No se pudo eliminar la reserva." }, 500);
    return json({ data });
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno" }, 500);
  }
};
