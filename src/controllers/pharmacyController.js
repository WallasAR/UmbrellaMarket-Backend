import { listPharmacies, getPharmacyById, resolveByDomain, listNearbyPharmacies } from "../services/pharmacyService.js";

const resolveDomain = async (req, res, next) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: "Domain query param required" });
    const pharmacy = await resolveByDomain(domain);
    if (!pharmacy) return res.status(404).json({ error: "Tenant not found for domain" });
    res.status(200).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const pharmacies = await listPharmacies();
    res.status(200).json(pharmacies);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const pharmacy = await getPharmacyById(req.params.id);
    res.status(200).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const nearby = async (req, res, next) => {
  try {
    const { lat, lng, radius_km: radiusKm } = req.query;
    const pharmacies = await listNearbyPharmacies({
      lat,
      lng,
      radiusKm: radiusKm ?? 10
    });
    res.status(200).json(pharmacies);
  } catch (error) {
    next(error);
  }
};

export { list, getById, nearby, resolveDomain };
