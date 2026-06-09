import dotenv from "dotenv";
import sdb from "./database.js";

dotenv.config();

let webpush = null;

const isConfigured = () =>
  Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

const getWebPush = async () => {
  if (!webpush && isConfigured()) {
    const module = await import("web-push");
    webpush = module.default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
  return webpush;
};

const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

const savePushSubscription = async (userId, subscription) => {
  const { error } = await sdb
    .from("User")
    .update({ push_subscription: subscription })
    .eq("id", userId);

  if (error) throw new Error(error.message);
};

const sendPushToUser = async (userId, { title, message }) => {
  if (!isConfigured()) return;

  const { data: user } = await sdb
    .from("User")
    .select("push_subscription")
    .eq("id", userId)
    .single();

  if (!user?.push_subscription) return;

  try {
    const push = await getWebPush();
    await push.sendNotification(
      user.push_subscription,
      JSON.stringify({ title, body: message })
    );
  } catch (error) {
    console.error("[push error]", error.message);
  }
};

export { getVapidPublicKey, savePushSubscription, sendPushToUser, isConfigured };
