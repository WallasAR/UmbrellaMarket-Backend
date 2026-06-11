import sdb from "./database.js";

const ALL_PERMISSIONS = [
  "dashboard",
  "orders",
  "products",
  "batches",
  "alerts",
  "financial",
  "prescriptions",
  "status",
  "billing",
  "team",
  "banners",
  "layout"
];

const ROLE_DEFAULTS = {
  operator: ["dashboard", "orders", "banners", "layout"],
  pharmacist: [
    "dashboard",
    "orders",
    "products",
    "batches",
    "alerts",
    "financial",
    "prescriptions",
    "status",
    "banners",
    "layout"
  ]
};

const listCustomPermissions = async (userId, pharmacyId) => {
  const { data, error } = await sdb
    .from("PharmacyStaffPermission")
    .select("permission")
    .eq("user_id", userId)
    .eq("pharmacy_id", pharmacyId);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.permission);
};

const getEffectivePermissions = async (userId, pharmacyId, role) => {
  if (role === "admin") return new Set(ALL_PERMISSIONS);

  const custom = await listCustomPermissions(userId, pharmacyId);
  if (custom.length) return new Set(custom);

  const defaults = ROLE_DEFAULTS[role] || [];
  return new Set(defaults);
};

const hasPermission = async (userId, pharmacyId, role, permission) => {
  const permissions = await getEffectivePermissions(userId, pharmacyId, role);
  return permissions.has(permission);
};

const listPharmacyStaff = async (pharmacyId) => {
  const { data: users, error } = await sdb
    .from("User")
    .select("id, name, email, role, created_at")
    .eq("pharmacy_id", pharmacyId)
    .in("role", ["operator", "pharmacist"])
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const staff = [];
  for (const user of users || []) {
    const permissions = [...(await getEffectivePermissions(user.id, pharmacyId, user.role))];
    staff.push({ ...user, permissions });
  }

  return staff;
};

const assignStaffMember = async ({ pharmacyId, email, role, grantedBy }) => {
  if (!["operator", "pharmacist"].includes(role)) {
    throw new Error("Role must be operator or pharmacist");
  }

  const { data: user, error } = await sdb
    .from("User")
    .select("id, email, pharmacy_id, role")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !user) throw new Error("User not found");

  if (user.pharmacy_id && user.pharmacy_id !== pharmacyId) {
    throw new Error("User already linked to another pharmacy");
  }

  const { error: updateError } = await sdb
    .from("User")
    .update({ pharmacy_id: pharmacyId, role })
    .eq("id", user.id);

  if (updateError) throw new Error(updateError.message);

  await sdb
    .from("PharmacyStaffPermission")
    .delete()
    .eq("user_id", user.id)
    .eq("pharmacy_id", pharmacyId);

  return { id: user.id, email: user.email, role, permissions: ROLE_DEFAULTS[role] };
};

const setStaffPermissions = async ({ pharmacyId, userId, permissions, grantedBy }) => {
  const allowed = permissions.filter((p) => ALL_PERMISSIONS.includes(p));
  if (!allowed.length) throw new Error("At least one valid permission is required");

  await sdb
    .from("PharmacyStaffPermission")
    .delete()
    .eq("user_id", userId)
    .eq("pharmacy_id", pharmacyId);

  const rows = allowed.map((permission) => ({
    user_id: userId,
    pharmacy_id: pharmacyId,
    permission,
    granted_by: grantedBy
  }));

  const { error } = await sdb.from("PharmacyStaffPermission").insert(rows);
  if (error) throw new Error(error.message);

  return allowed;
};

const removeStaffMember = async ({ pharmacyId, userId }) => {
  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("owner_user_id")
    .eq("id", pharmacyId)
    .single();

  if (pharmacy?.owner_user_id === userId) {
    throw new Error("Cannot remove pharmacy owner");
  }

  await sdb
    .from("PharmacyStaffPermission")
    .delete()
    .eq("user_id", userId)
    .eq("pharmacy_id", pharmacyId);

  const { error } = await sdb
    .from("User")
    .update({ pharmacy_id: null, role: "customer" })
    .eq("id", userId)
    .eq("pharmacy_id", pharmacyId);

  if (error) throw new Error(error.message);
};

export {
  ALL_PERMISSIONS,
  ROLE_DEFAULTS,
  getEffectivePermissions,
  hasPermission,
  listPharmacyStaff,
  assignStaffMember,
  setStaffPermissions,
  removeStaffMember
};
