import sdb from "./database.js";
import { applyProductDiscount } from "../utils/pricing.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";

const createPriceAlert = async ({ userId, medicineId, targetPrice, notifyPush = true, notifyEmail = true }) => {
  const { data, error } = await sdb
    .from("PriceAlert")
    .insert({
      user_id: userId,
      medicine_id: medicineId,
      target_price: targetPrice,
      notify_push: notifyPush,
      notify_email: notifyEmail
    })
    .select("*, Medicine(id, name)")
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const listUserPriceAlerts = async (userId) => {
  const { data, error } = await sdb
    .from("PriceAlert")
    .select("*, Medicine(id, name, price, discount, Images(thumb_img))")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const deactivatePriceAlert = async (userId, alertId) => {
  const { error } = await sdb
    .from("PriceAlert")
    .update({ active: false })
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};

const scanPriceAlerts = async () => {
  const { data: alerts, error } = await sdb
    .from("PriceAlert")
    .select("*, Medicine(id, name, price, discount), User(email, name)")
    .eq("active", true)
    .is("triggered_at", null);

  if (error) throw new Error(error.message);

  let triggeredCount = 0;

  for (const alert of alerts || []) {
    const currentPrice = applyProductDiscount(alert.Medicine?.price, alert.Medicine?.discount);
    if (currentPrice > Number(alert.target_price)) continue;

    await sdb
      .from("PriceAlert")
      .update({ triggered_at: new Date().toISOString(), active: false })
      .eq("id", alert.id);

    const message = `${alert.Medicine?.name} atingiu R$ ${currentPrice.toFixed(2)} (sua meta: R$ ${Number(alert.target_price).toFixed(2)}).`;

    if (alert.notify_push) {
      await createNotification({
        user_id: alert.user_id,
        title: "Alerta de preço",
        message,
        type: "price_alert"
      });
    }

    if (alert.notify_email && alert.User?.email) {
      await sendEmail({
        to: alert.User.email,
        subject: "Alerta de preço - Umbrella Farmácia",
        text: `Olá ${alert.User.name || ""}, ${message}`
      });
    }

    triggeredCount += 1;
  }

  return { scanned: (alerts || []).length, triggered: triggeredCount };
};

export {
  createPriceAlert,
  listUserPriceAlerts,
  deactivatePriceAlert,
  scanPriceAlerts
};
