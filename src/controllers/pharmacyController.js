import { listPharmacies, getPharmacyById } from "../services/pharmacyService.js";

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

export { list, getById };
