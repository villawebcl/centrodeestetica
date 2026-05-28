import { describe, expect, it } from "vitest";
import {
  sanitizeProfessionalPayload,
  sanitizePromotionPayload,
  sanitizeServicePayload,
  validateServicePayload
} from "../../src/lib/adminPayloads";

type Row = { id: string; nombre?: string; activo?: boolean; [key: string]: unknown };

class MemoryCrud {
  private rows = new Map<string, Row>();

  create(payload: Omit<Row, "id">): Row {
    const id = crypto.randomUUID();
    const row: Row = { id, activo: true, ...payload };
    this.rows.set(id, row);
    return row;
  }

  update(id: string, payload: Partial<Row>) {
    const row = this.rows.get(id);
    if (!row) return null;
    const next = { ...row, ...payload };
    this.rows.set(id, next);
    return next;
  }

  delete(id: string) {
    return this.rows.delete(id);
  }
}

describe("admin CRUD payloads", () => {
  it("sanitizes and validates service CRUD payloads", () => {
    const store = new MemoryCrud();
    const payload = sanitizeServicePayload({
      nombre: "  Limpieza facial  ",
      categoria: "No valida",
      duracion: "60 min",
      precio: "$25.000",
      descripcion: "Tratamiento"
    });

    expect(validateServicePayload(payload)).toBeNull();
    expect(payload.categoria).toBe("Facial");

    const created = store.create(payload);
    expect(created.nombre).toBe("Limpieza facial");
    expect(store.update(created.id, { activo: false })?.activo).toBe(false);
    expect(store.delete(created.id)).toBe(true);
  });

  it("sanitizes professional and promotion payloads", () => {
    expect(
      sanitizeProfessionalPayload({
        nombre: " Ana ",
        rol: "Especialista",
        especialidad: "Facial",
        bio: "x".repeat(900)
      })
    ).toMatchObject({ nombre: "Ana", bio: "x".repeat(700) });

    expect(
      sanitizePromotionPayload({
        nombre: "Promo",
        incluye: "Evaluacion\n\nLimpieza"
      }).incluye
    ).toEqual(["Evaluacion", "Limpieza"]);
  });
});
