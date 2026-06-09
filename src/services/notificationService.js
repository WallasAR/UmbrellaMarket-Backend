import sdb from "./database.js";
import { sendPushToUser } from "./pushService.js";

const listNotifications = async (userId) => {
  const { data, error } = await sdb
    .from("Notification")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const createNotification = async ({ user_id, title, message, type = "info" }) => {
  const { data, error } = await sdb
    .from("Notification")
    .insert({ user_id, title, message, type })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sendPushToUser(user_id, { title, message });
  return data;
};

const markAsRead = async (userId, notificationId) => {
  const { error } = await sdb
    .from("Notification")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};

export { listNotifications, createNotification, markAsRead };
