import {
  getPharmacyBilling,
  createPlanCheckout,
  createBillingPortal
} from "../services/billingService.js";
import sdb from "../services/database.js";
import {
  getDashboard,
  listProducts,
  listBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getAlerts,
  listPharmacyOrders,
  updatePharmacyOrderStatus,
  updateOperationalStatus,
  runAlertScan
} from "../services/pharmacyPanelService.js";

const dashboard = async (req, res, next) => {
  try {
    const data = await getDashboard(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const products = async (req, res, next) => {
  try {
    const data = await listProducts(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const batches = async (req, res, next) => {
  try {
    const data = await listBatches(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addBatch = async (req, res, next) => {
  try {
    const data = await createBatch(req.pharmacyId, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const editBatch = async (req, res, next) => {
  try {
    const data = await updateBatch(req.pharmacyId, req.params.id, req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const removeBatch = async (req, res, next) => {
  try {
    await deleteBatch(req.pharmacyId, req.params.id);
    res.status(200).json({ message: "Batch removed" });
  } catch (error) {
    next(error);
  }
};

const alerts = async (req, res, next) => {
  try {
    const data = await getAlerts(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const scanAlerts = async (req, res, next) => {
  try {
    const data = await runAlertScan(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const orders = async (req, res, next) => {
  try {
    const data = await listPharmacyOrders(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const setOrderStatus = async (req, res, next) => {
  try {
    await updatePharmacyOrderStatus(req.pharmacyId, req.params.sessionId, req.body.order_status);
    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    next(error);
  }
};

const setOperationalStatus = async (req, res, next) => {
  try {
    const data = await updateOperationalStatus(req.pharmacyId, req.body.operational_status);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const billing = async (req, res, next) => {
  try {
    const data = await getPharmacyBilling(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const billingCheckout = async (req, res, next) => {
  try {
    const { data: user } = await sdb.from("User").select("email").eq("id", req.user.id).single();
    const data = await createPlanCheckout(req.pharmacyId, req.body.plan_tier, user?.email);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const billingPortal = async (req, res, next) => {
  try {
    const url = await createBillingPortal(req.pharmacyId);
    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};

export {
  billing,
  billingCheckout,
  billingPortal,
  dashboard,
  products,
  batches,
  addBatch,
  editBatch,
  removeBatch,
  alerts,
  scanAlerts,
  orders,
  setOrderStatus,
  setOperationalStatus
};
