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

export {
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
