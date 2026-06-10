const ROLE_PERMISSIONS = {
  operator: new Set(["dashboard", "orders"]),
  pharmacist: new Set([
    "dashboard",
    "orders",
    "products",
    "batches",
    "alerts",
    "financial",
    "prescriptions",
    "status"
  ])
};

const requirePharmacyPermission = (permission) => (req, res, next) => {
  const role = req.user?.role || "customer";

  if (role === "admin") {
    return next();
  }

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions?.has(permission)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

const requirePharmacyOwner = (req, res, next) => {
  const role = req.user?.role || "customer";

  if (role === "admin") {
    return next();
  }

  if (!req.isPharmacyOwner) {
    return res.status(403).json({ message: "Only the pharmacy owner can access this resource" });
  }

  next();
};

export { requirePharmacyPermission, requirePharmacyOwner };
