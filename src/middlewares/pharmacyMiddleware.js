import sdb from "../services/database.js";

const resolveUserPharmacy = async (req, res, next) => {
  try {
    const role = req.user?.role || "customer";

    if (role === "admin") {
      const pharmacyId = req.headers["x-pharmacy-id"] || req.query.pharmacyId;
      if (pharmacyId) {
        req.pharmacyId = pharmacyId;
        req.isPharmacyOwner = true;
        return next();
      }
    }

    const { data, error } = await sdb
      .from("User")
      .select("pharmacy_id")
      .eq("id", req.user.id)
      .single();

    if (error || !data?.pharmacy_id) {
      return res.status(403).json({ message: "Pharmacy access not configured" });
    }

    req.pharmacyId = data.pharmacy_id;

    const { data: pharmacy } = await sdb
      .from("Pharmacy")
      .select("owner_user_id")
      .eq("id", data.pharmacy_id)
      .single();

    req.isPharmacyOwner = pharmacy?.owner_user_id === req.user.id;
    next();
  } catch (err) {
    next(err);
  }
};

export default resolveUserPharmacy;
