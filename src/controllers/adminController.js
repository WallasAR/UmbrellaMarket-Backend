import {
  createProduct,
  updateProduct,
  deleteProduct,
  listUsers,
  updateUserRole,
  getDashboardStats
} from "../services/adminService.js";
import { logAudit } from "../services/auditService.js";
import { listAllOrders, updateOrderStatus } from "../services/orderService.js";
import { listCoupons, createCoupon } from "../services/couponService.js";
import { 
  createPharmacy, 
  listAllPharmacies, 
  updatePharmacy, 
  deletePharmacy 
} from "../services/pharmacyService.js";
import { listAuditLogs } from "../services/auditService.js";
import {
  listAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from "../services/bannerService.js";
import { getActiveLayout, savePharmacyLayout } from "../services/layoutService.js";

const dashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

const createMedicine = async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const removeMedicine = async (req, res, next) => {
  try {
    await deleteProduct(Number(req.params.id));
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

const users = async (req, res, next) => {
  try {
    const data = await listUsers();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const setUserRole = async (req, res, next) => {
  try {
    await updateUserRole(req.params.id, req.body.role);

    await logAudit({
      actorId: req.user.id,
      action: "user.role_updated",
      entityType: "User",
      entityId: req.params.id,
      payload: { role: req.body.role },
      ipAddress: req.ip
    });

    res.status(200).json({ message: "Role updated" });
  } catch (error) {
    next(error);
  }
};

const orders = async (req, res, next) => {
  try {
    const data = await listAllOrders();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const setOrderStatus = async (req, res, next) => {
  try {
    await updateOrderStatus(req.params.sessionId, req.body.order_status);
    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    next(error);
  }
};

const coupons = async (req, res, next) => {
  try {
    const data = await listCoupons();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addCoupon = async (req, res, next) => {
  try {
    const coupon = await createCoupon(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

const getAllPharmacies = async (req, res, next) => {
  try {
    const data = await listAllPharmacies();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const addPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await createPharmacy({
      name: req.body.name,
      owner_email: req.body.owner_email
    });
    res.status(201).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const editPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await updatePharmacy(req.params.id, req.body);
    res.status(200).json(pharmacy);
  } catch (error) {
    next(error);
  }
};

const removePharmacy = async (req, res, next) => {
  try {
    await deletePharmacy(req.params.id);
    res.status(200).json({ message: "Pharmacy removed" });
  } catch (error) {
    next(error);
  }
};

const auditLogs = async (req, res, next) => {
  try {
    const logs = await listAuditLogs({
      limit: Number(req.query.limit) || 50,
      entityType: req.query.entity_type,
      actorId: req.query.actor_id
    });
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

const banners = async (req, res, next) => {
  try {
    const items = await listAllBanners();
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

const addBanner = async (req, res, next) => {
  try {
    const banner = await createBanner(req.body);
    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

const editBanner = async (req, res, next) => {
  try {
    const banner = await updateBanner(req.params.id, req.body);
    res.status(200).json(banner);
  } catch (error) {
    next(error);
  }
};

const removeBanner = async (req, res, next) => {
  try {
    await deleteBanner(req.params.id);
    res.status(200).json({ message: "Banner removed" });
  } catch (error) {
    next(error);
  }
};

const getGlobalLayout = async (req, res, next) => {
  try {
    const layout = await getActiveLayout(null);
    res.status(200).json([layout]); // Returns an array to match PharmacyPanel's expectation
  } catch (error) {
    next(error);
  }
};

const saveGlobalLayout = async (req, res, next) => {
  try {
    const layout = await savePharmacyLayout(null, { ...req.body, is_preset: true });
    res.status(200).json(layout);
  } catch (error) {
    next(error);
  }
};

export {
  dashboard,
  createMedicine,
  updateMedicine,
  removeMedicine,
  users,
  setUserRole,
  orders,
  setOrderStatus,
  coupons,
  addCoupon,
  getAllPharmacies,
  addPharmacy,
  editPharmacy,
  removePharmacy,
  auditLogs,
  banners,
  addBanner,
  editBanner,
  removeBanner,
  getGlobalLayout,
  saveGlobalLayout
};
