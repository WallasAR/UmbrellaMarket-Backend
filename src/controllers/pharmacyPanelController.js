import {
  getPharmacyBilling,
  createPlanCheckout,
  createBillingPortal
} from "../services/billingService.js";
import { logAudit } from "../services/auditService.js";
import { confirmPickup } from "../services/pickupService.js";
import { advanceDeliveryStatus, listPharmacyDeliveries } from "../services/deliveryService.js";
import { getPriceBenchmark, getProductPriceHistory, recordPriceSnapshot } from "../services/priceHistoryService.js";
import {
  listPharmacyBoosts,
  createBoost,
  deactivateBoost,
  getBoostMetrics
} from "../services/boostService.js";
import sdb from "../services/database.js";
import {
  getDashboard,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
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

const addProduct = async (req, res, next) => {
  try {
    const data = await createProduct(req.pharmacyId, req.body);
    await recordPriceSnapshot({
      medicineId: data.id,
      pharmacyId: req.pharmacyId,
      price: data.price,
      discount: data.discount || 0,
      source: "manual"
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const data = await updateProduct(req.pharmacyId, Number(req.params.id), req.body);

    if (req.body.price != null || req.body.discount != null) {
      await logAudit({
        actorId: req.user.id,
        action: "medicine.price_changed",
        entityType: "Medicine",
        entityId: req.params.id,
        payload: { price: req.body.price, discount: req.body.discount, pharmacy_id: req.pharmacyId },
        ipAddress: req.ip
      });
      await recordPriceSnapshot({
        medicineId: Number(req.params.id),
        pharmacyId: req.pharmacyId,
        price: data.price,
        discount: data.discount || 0,
        source: "manual"
      });
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    await deleteProduct(req.pharmacyId, Number(req.params.id));
    res.status(200).json({ message: "Product removed" });
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

const confirmPickupOrder = async (req, res, next) => {
  try {
    const pickup = await confirmPickup({
      pickupCode: req.body.pickup_code,
      pharmacyId: req.pharmacyId,
      staffId: req.user.id
    });
    res.status(200).json(pickup);
  } catch (error) {
    next(error);
  }
};

const productPriceBenchmark = async (req, res, next) => {
  try {
    const data = await getPriceBenchmark(Number(req.params.id), req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const productPriceHistory = async (req, res, next) => {
  try {
    const data = await getProductPriceHistory(
      Number(req.params.id),
      req.pharmacyId,
      req.query.period || "90d"
    );
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const deliveries = async (req, res, next) => {
  try {
    const data = await listPharmacyDeliveries(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const advanceDelivery = async (req, res, next) => {
  try {
    const data = await advanceDeliveryStatus(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const boosts = async (req, res, next) => {
  try {
    const data = await listPharmacyBoosts(req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addBoost = async (req, res, next) => {
  try {
    const data = await createBoost({
      pharmacyId: req.pharmacyId,
      medicineId: req.body.medicine_id,
      days: req.body.days,
      priority: req.body.priority
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const removeBoost = async (req, res, next) => {
  try {
    const data = await deactivateBoost(req.params.id, req.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const boostMetrics = async (req, res, next) => {
  try {
    const data = await getBoostMetrics(req.pharmacyId, req.query.period || "30d");
    res.status(200).json(data);
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
  addProduct,
  editProduct,
  removeProduct,
  batches,
  addBatch,
  editBatch,
  removeBatch,
  alerts,
  scanAlerts,
  orders,
  setOrderStatus,
  setOperationalStatus,
  confirmPickupOrder,
  productPriceBenchmark,
  productPriceHistory,
  deliveries,
  advanceDelivery,
  boosts,
  addBoost,
  removeBoost,
  boostMetrics
};
