import { hasPermission } from "../services/staffService.js";

const requirePharmacyPermission = (permission) => async (req, res, next) => {
  try {
    const role = req.user?.role || "customer";

    if (role === "admin") {
      return next();
    }

    const allowed = await hasPermission(req.user.id, req.pharmacyId, role, permission);
    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    next(error);
  }
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
