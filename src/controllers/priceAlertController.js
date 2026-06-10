import {
  createPriceAlert,
  listUserPriceAlerts,
  deactivatePriceAlert,
  scanPriceAlerts
} from "../services/priceAlertService.js";

const create = async (req, res, next) => {
  try {
    const alert = await createPriceAlert({
      userId: req.user.id,
      medicineId: req.body.medicine_id,
      targetPrice: req.body.target_price,
      notifyPush: req.body.notify_push,
      notifyEmail: req.body.notify_email
    });
    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const alerts = await listUserPriceAlerts(req.user.id);
    res.status(200).json(alerts);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deactivatePriceAlert(req.user.id, req.params.id);
    res.status(200).json({ message: "Alert removed" });
  } catch (error) {
    next(error);
  }
};

const scan = async (req, res, next) => {
  try {
    const result = await scanPriceAlerts();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export { create, list, remove, scan };
