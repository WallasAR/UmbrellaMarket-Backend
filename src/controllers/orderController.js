import { listUserOrders, getUserOrder } from "../services/orderService.js";

const listOrders = async (req, res, next) => {
  try {
    const orders = await listUserOrders(req.user.id);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await getUserOrder(req.user.id, req.params.sessionId);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export { listOrders, getOrder };
