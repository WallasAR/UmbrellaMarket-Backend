import {
  listPlans,
  getUserOnboardingStatus,
  registerPharmacy,
  listPendingPharmacies,
  approvePharmacy,
  rejectPharmacy
} from "../services/onboardingService.js";
import { requireFields } from "../utils/validate.js";

const plans = async (req, res, next) => {
  try {
    const data = await listPlans();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const status = async (req, res, next) => {
  try {
    const data = await getUserOnboardingStatus(req.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "cnpj", "address", "city", "state", "cep", "phone"]);
    const pharmacy = await registerPharmacy(req.user.id, req.body);
    res.status(201).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const pending = async (req, res, next) => {
  try {
    const data = await listPendingPharmacies();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const pharmacy = await approvePharmacy(req.params.id);
    res.status(200).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const pharmacy = await rejectPharmacy(req.params.id, req.body.reason);
    res.status(200).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

export { plans, status, register, pending, approve, reject };
