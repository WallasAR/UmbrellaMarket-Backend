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

const listAuditLogs = async ({ limit = 50, entityType, actorId } = {}) => {
  let query = sdb
    .from("AuditLog")
    .select("*, User:actor_id(email, name)")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (entityType) query = query.eq("entity_type", entityType);
  if (actorId) query = query.eq("actor_id", actorId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export { logAudit, listAuditLogs };
