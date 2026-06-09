import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhooks.js';
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
