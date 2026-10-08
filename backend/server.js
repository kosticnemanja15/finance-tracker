import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { globalLimiter } from './middleware/rateLimit.js';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './errors/ApiError.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';


const app = express();

// Render (kao svaki PaaS) stavlja load balancer ispred aplikacije.
// Bez ovoga req.ip = IP load balancera → rate limiter broji SVE posetioce kao jednog.
// 1 = veruj tačno jednom hopu. Veći broj od stvarnog = klijent može da lažira IP
// kroz X-Forwarded-For i zaobiđe rate limit. Proveravamo na Renderu (Korak 8).
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// Middleware chain — redosled je bitan
app.use(helmet());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);
app.use(cors({
  origin: config.env === 'production'
    ? config.frontendUrl
    : '*',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Health check — dokazuje da ceo chain radi
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/categories', categoriesRouter);
app.use('/transactions', transactionsRouter);

// 404 — sve što nije uhvatila nijedna ruta iznad
app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Error handler MORA biti poslednji
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port} [${config.env}]`);
});