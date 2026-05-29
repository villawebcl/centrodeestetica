import { createSupabaseAdminClient } from "./supabaseAdmin";

type AuditParams = {
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

export async function logAudit({ action, entity, entityId = null, details = {} }: AuditParams) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("audit_logs").insert([
      {
        actor: "admin",
        action,
        entity,
        entity_id: entityId,
        details
      }
    ]);
  } catch (error) {
    console.error("Audit log failed", error);
  }
}
