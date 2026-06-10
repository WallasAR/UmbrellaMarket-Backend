import {
  createConnectOnboardingLink,
  refreshConnectStatus
} from "../services/connectService.js";

const startOnboarding = async (req, res, next) => {
  try {
    const data = await createConnectOnboardingLink(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const data = await refreshConnectStatus(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export { startOnboarding, getStatus };
