import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhooks.js';
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import pharmacyRoutes from "./routes/pharmacies.js";
import pharmacyPanelRoutes from "./routes/pharmacy-panel.js";
import copilotRoutes from "./routes/copilot.js";
import layoutRoutes from "./routes/layout.js";
import searchRoutes from "./routes/search.js";
import favoriteRoutes from "./routes/favorite.js";
import dotenv from 'dotenv';
import errorMiddleware from './middlewares/errorMiddleware.js';
import { apiLimiter, webhookLimiter } from './middlewares/rateLimitMiddleware.js';
import requestLogger from './middlewares/requestLoggerMiddleware.js';
import path from "path";
import { fileURLToPath } from "url";
import setupSwagger from './doc/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(requestLogger);

// Stripe webhook must receive raw body before JSON parser
app.use('/api/webhooks', webhookLimiter, webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pharmacy", pharmacyPanelRoutes);
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/layout", layoutRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api", routes);
app.use(errorMiddleware);
app.use('/static', express.static(path.join(path.resolve(), 'src/public')));

setupSwagger(app);

app.get('/', (req, res) => {
  res.send('Server online');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

export default app;
