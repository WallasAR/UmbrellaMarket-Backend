import { listPharmacies, getPharmacyById, listNearbyPharmacies } from "../services/pharmacyService.js";

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

export { list, getById, nearby };
