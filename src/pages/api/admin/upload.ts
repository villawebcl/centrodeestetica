export const prerender = false;
import type { APIRoute } from "astro";
import { assertSameOrigin } from "@lib/adminAuth";
import { cleanString, json } from "@lib/api";
import { logAudit } from "@lib/audit";
import { createSupabaseAdminClient } from "@lib/supabaseAdmin";

const allowedFolders = new Set(["servicios", "profesionales"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxSize = 2 * 1024 * 1024;

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export const POST: APIRoute = async ({ request }) => {
  if (!assertSameOrigin(request, new URL(request.url))) return json({ error: "Origen no permitido" }, 403);

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = cleanString(form.get("folder"), 30);

    if (!(file instanceof File)) return json({ error: "Falta el archivo." }, 400);
    if (!allowedFolders.has(folder)) return json({ error: "Destino invalido." }, 400);
    if (!allowedTypes.has(file.type)) return json({ error: "Formato no permitido." }, 400);
    if (file.size > maxSize) return json({ error: "La imagen no puede superar 2 MB." }, 400);

    const supabase = createSupabaseAdminClient();
    const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
    const { error } = await supabase.storage.from("admin-assets").upload(path, file, {
      contentType: file.type,
      upsert: false
    });

    if (error) return json({ error: "No se pudo subir la imagen." }, 500);

    const { data } = supabase.storage.from("admin-assets").getPublicUrl(path);
    await logAudit({ action: "upload", entity: folder, entityId: path, details: { contentType: file.type, size: file.size } });

    return json({ url: data.publicUrl, path }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "Error interno." }, 500);
  }
};
