import sdb from "./database.js";

const logAudit = async ({ actorId, action, entityType, entityId, payload = {}, ipAddress = null }) => {
  try {
    const { error } = await sdb.from("AuditLog").insert({
      actor_id: actorId || null,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      payload,
      ip_address: ipAddress
    });

    if (error) {
      console.error("Audit log failed:", error.message);
    }
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

export { logAudit };
