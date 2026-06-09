import { listNotifications, markAsRead } from "../services/notificationService.js";
import { getVapidPublicKey, savePushSubscription } from "../services/pushService.js";

const list = async (req, res, next) => {
  try {
    const notifications = await listNotifications(req.user.id);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    await markAsRead(req.user.id, req.params.id);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

const vapidKey = async (req, res) => {
  res.status(200).json({ publicKey: getVapidPublicKey() });
};

const subscribePush = async (req, res, next) => {
  try {
    await savePushSubscription(req.user.id, req.body);
    res.status(200).json({ message: "Push subscription saved" });
  } catch (error) {
    next(error);
  }
};

export { list, markRead, vapidKey, subscribePush };
