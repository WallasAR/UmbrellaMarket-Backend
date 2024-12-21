import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const hostname = process.env.HOSTNAME;
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// index route
app.get('/', (req, res) => {
    res.send('Server online');
});

// Listen ping
app.listen(PORT, hostname, () => {
    console.log(`Servidor rodando em http://${hostname}:${PORT}`);
  
    // Inicia o ping a cada 3000ms (3 segundos) após o servidor ser iniciado
    setInterval(() => {
        const startRequest = Date.now();

        const req = http.request(
            {
                hostname: hostname,
                port: PORT,
                path: "/", // Rota principal
            },
            (res) => {
                const pingTime = Date.now() - startRequest;
                console.log(
                    `${res.statusCode} | ${hostname} | ${pingTime}ms | ${new Date()
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ")}`
                );
            }
        );

        req.on("error", (e) => {
            console.error(`Erro ao pingar servidor: ${e.message}`);
        });

        req.end();
    }, 3000);
});