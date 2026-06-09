import dotenv from "dotenv";

dotenv.config();

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const sendEmail = async ({ to, subject, text }) => {
  if (!isConfigured() || !to) {
    console.log(`[email skipped] ${subject} -> ${to || "no recipient"}`);
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text
    });
  } catch (error) {
    console.error("[email error]", error.message);
  }
};

export { sendEmail, isConfigured };
