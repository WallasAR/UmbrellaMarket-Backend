import { completePharmacyInvite } from "../services/onboardingService.js";

const completeInvite = async (req, res, next) => {
  try {
    const data = await completePharmacyInvite(req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export { completeInvite };
