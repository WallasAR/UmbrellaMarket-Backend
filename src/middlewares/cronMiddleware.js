const verifyCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ message: "Cron not configured" });
  }

  const header = req.headers["x-cron-secret"] || req.query.secret;
  if (header !== secret) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

export default verifyCronSecret;
