import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import dotenv from 'dotenv';
import http from 'http';
import errorMiddleware from './middlewares/errorMiddleware.js';
import path from "path";
import setupSwagger from './doc/index.js';

dotenv.config();

const app = express();
const hostname = process.env.HOSTNAME;
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Middleware for handle errors
app.use(errorMiddleware);

// static routes
app.use('/static', express.static(path.join(path.resolve(), 'src/public')));

// Documentation
setupSwagger(app);

// index route
app.get('/', (req, res) => {
    res.send('Server online');
});

// Listen ping
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })