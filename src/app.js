import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhooks.js';
import dotenv from 'dotenv';
import errorMiddleware from './middlewares/errorMiddleware.js';
import path from "path";
import setupSwagger from './doc/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// Stripe webhook must receive raw body before JSON parser
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use("/api", routes);
app.use(errorMiddleware);
app.use('/static', express.static(path.join(path.resolve(), 'src/public')));

setupSwagger(app);

app.get('/', (req, res) => {
  res.send('Server online');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
