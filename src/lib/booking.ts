import { cleanString } from "./api";

export const phoneRegex = /^\+?[0-9\s()-]{8,20}$/;
export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export type BookingPayload = {
  cliente_nombre: string;
  cliente_telefono: string;
  servicio_nombre: string;
  profesional_nombre: string;
  fecha: string | null;
  hora: string;
  notas: string;
  consent: boolean;
  estado: "pendiente";
};

export type BookingResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

type SupabaseRpcClient = {
  rpc: (
    name: string,
    params: Record<string, string | null>
  ) => PromiseLike<{ error?: { message?: string } | null }>;
};

export function parseFutureDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date <= today ? null : value;
}

export function sanitizeBookingPayload(body: Record<string, unknown>, now = new Date()): BookingPayload {
  return {
    cliente_nombre: cleanString(body.name, 90),
    cliente_telefono: cleanString(body.phone, 30),
    servicio_nombre: cleanString(body.service, 120),
    profesional_nombre: cleanString(body.professional, 120),
    fecha: parseFutureDate(cleanString(body.date, 10), now),
    hora: cleanString(body.time, 5),
    notas: cleanString(body.notes, 700),
    consent: body.consent === true || body.consent === "true" || body.consent === "on",
    estado: "pendiente"
  };
}

export function validateBookingPayload(payload: BookingPayload) {
  if (!payload.consent) {
    return { status: 400, error: "Debes aceptar la politica de privacidad para solicitar una reserva." };
  }
  if (!payload.cliente_nombre || !phoneRegex.test(payload.cliente_telefono)) {
    return { status: 400, error: "Nombre o telefono invalido." };
  }
  if (!payload.servicio_nombre || !payload.profesional_nombre || !payload.fecha || !timeRegex.test(payload.hora)) {
    return { status: 400, error: "Datos de reserva invalidos." };
  }
  return null;
}

export async function createPublicReservation(
  supabase: SupabaseRpcClient,
  payload: BookingPayload
): Promise<BookingResult> {
  const validationError = validateBookingPayload(payload);
  if (validationError) return { ok: false, ...validationError };

  const { error } = await supabase.rpc("crear_reserva_publica", {
    p_cliente_nombre: payload.cliente_nombre,
    p_cliente_telefono: payload.cliente_telefono,
    p_servicio_nombre: payload.servicio_nombre,
    p_profesional_nombre: payload.profesional_nombre,
    p_fecha: payload.fecha,
    p_hora: payload.hora,
    p_notas: payload.notas
  });

  if (error?.message === "slot_unavailable") {
    return { ok: false, status: 409, error: "Este horario ya no está disponible. Por favor elige otro." };
  }
  if (error?.message === "service_or_professional_unavailable") {
    return { ok: false, status: 400, error: "Servicio o profesional no disponible." };
  }
  if (error) return { ok: false, status: 500, error: "No se pudo crear la reserva." };

  return { ok: true };
}
