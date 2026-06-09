import dotenv from "dotenv";

dotenv.config();

const isConfigured = () =>
  Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);

const sendWhatsApp = async ({ to, message }) => {
  if (!isConfigured() || !to || !message) {
    console.log(`[whatsapp skipped] ${to || "no recipient"}: ${message?.slice(0, 60)}`);
    return;
  }

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`
      },
      body: JSON.stringify({
        to,
        message,
        channel: process.env.WHATSAPP_CHANNEL || "umbrella-alerts"
      })
    });

    if (!response.ok) {
      console.error("[whatsapp error]", await response.text());
    }
  } catch (error) {
    console.error("[whatsapp error]", error.message);
  }
};

export { sendWhatsApp, isConfigured };
