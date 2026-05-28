export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin, isAdminSessionValid, hashPassword, verifyHashedPassword, safeEqual } from "@lib/adminAuth";
import { json } from "@lib/api";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

export const PATCH: APIRoute = async ({ cookies, request }) => {
  if (!(await isAdminSessionValid(cookies))) return json({ error: "No autorizado" }, 401);
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  const body = await request.json();
  const current  = String(body.current_password  ?? "");
  const next     = String(body.new_password      ?? "");
  const confirm  = String(body.confirm_password  ?? "");

  if (!current || !next || !confirm) return json({ error: "Todos los campos son obligatorios." }, 400);
  if (next.length < 8) return json({ error: "La contraseña nueva debe tener al menos 8 caracteres." }, 400);
  if (next !== confirm) return json({ error: "Las contraseñas no coinciden." }, 400);

  const supabase = createSupabaseAdminClient();
  const { data: config } = await supabase
    .from("configuracion")
    .select("password_hash")
    .single();

  let isValid = false;
  if (config?.password_hash) {
    isValid = await verifyHashedPassword(current, config.password_hash);
  } else {
    const envPass = import.meta.env.ADMIN_PASSWORD ?? "";
    isValid = envPass.length > 0 && safeEqual(current, envPass);
  }

  if (!isValid) return json({ error: "La contraseña actual es incorrecta." }, 403);

  const newHash = await hashPassword(next);
  const { error: dbError } = await supabase
    .from("configuracion")
    .update({ password_hash: newHash })
    .eq("id", 1);

  if (dbError) return json({ error: dbError.message }, 500);

  return json({ ok: true });
};
