import {
  getActiveLayout,
  getFactoryLayoutTemplate,
  restoreFactoryPreset
} from "../services/layoutService.js";

const getPublicLayout = async (req, res, next) => {
  try {
    const pharmacyId = req.query.pharmacy_id || null;
    const layout = await getActiveLayout(pharmacyId);
    res.status(200).json(layout);
  } catch (error) {
    next(error);
  }
};

const getFactoryTemplate = async (req, res, next) => {
  try {
    res.status(200).json(getFactoryLayoutTemplate());
  } catch (error) {
    next(error);
  }
};

const forceRestorePreset = async (req, res, next) => {
  try {
    const layout = await restoreFactoryPreset();
    res.status(200).json({ success: true, message: "Original factory layout restored.", layout });
  } catch (error) {
    next(error);
  }
};

export { getPublicLayout, getFactoryTemplate, forceRestorePreset };
