import { randomUUID } from "crypto";

const requestLogger = (req, res, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const entry = {
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(entry));
  });

  next();
};

export default requestLogger;
