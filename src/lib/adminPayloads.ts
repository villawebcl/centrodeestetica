import { cleanString } from "./api";

const allowedCategories = new Set(["Facial", "Corporal", "Mirada", "Asesoria"]);

export function sanitizeServicePayload(raw: Record<string, unknown>) {
  const categoria = cleanString(raw.categoria, 40);

  return {
    nombre: cleanString(raw.nombre, 90),
    categoria: allowedCategories.has(categoria) ? categoria : "Facial",
    duracion: cleanString(raw.duracion, 30),
    precio: cleanString(raw.precio, 40),
    descripcion: cleanString(raw.descripcion, 700),
    imagen_url: cleanString(raw.imagen_url, 500)
  };
}

export function validateServicePayload(payload: ReturnType<typeof sanitizeServicePayload>) {
  if (!payload.nombre) return "El nombre del servicio es obligatorio.";
  return null;
}

export function sanitizeProfessionalPayload(raw: Record<string, unknown>) {
  return {
    nombre: cleanString(raw.nombre, 90),
    rol: cleanString(raw.rol, 60),
    especialidad: cleanString(raw.especialidad, 120),
    bio: cleanString(raw.bio, 700),
    foto_url: cleanString(raw.foto_url, 500)
  };
}

export function sanitizePromotionPayload(raw: Record<string, unknown>) {
  const incluyeRaw = raw.incluye;
  const incluye: string[] = Array.isArray(incluyeRaw)
    ? incluyeRaw.map((item) => cleanString(item, 200)).filter(Boolean)
    : typeof incluyeRaw === "string"
      ? incluyeRaw.split("\n").map((item) => cleanString(item, 200)).filter(Boolean)
      : [];

  return {
    nombre: cleanString(raw.nombre, 90),
    precio: cleanString(raw.precio, 40),
    precio_antes: cleanString(raw.precio_antes, 40),
    tag: cleanString(raw.tag, 60),
    descripcion: cleanString(raw.descripcion, 700),
    incluye
  };
}
