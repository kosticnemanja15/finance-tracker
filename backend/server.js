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

// Render (kao svaki PaaS) stavlja proxy-je ispred aplikacije.
// Bez ovoga req.ip = IP proxy-ja → rate limiter broji SVE posetioce kao jednog.
// Broj hopova dolazi iz TRUST_PROXY_HOPS (izmeren na Renderu, ne pretpostavljen).
if (config.env === 'production') {
  app.set('trust proxy', config.trustProxyHops);
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

// ⚠️ PRIVREMENO (Dan 10) — merenje proxy lanca na Renderu. UKLONITI posle merenja.
app.get('/debug/ip', (req, res) => {
  res.json({
    ip: req.ip,
    ips: req.ips,
    xff: req.headers['x-forwarded-for'] ?? null,
    socket: req.socket.remoteAddress,
    trustProxy: app.get('trust proxy'),
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

// Express 5: callback dobija grešku i kad listen NE uspe (npr. EADDRINUSE).
// Bez provere bi pad izgledao kao uspešan start.
app.listen(config.port, (err) => {
  if (err) {
    console.error(`❌ Server failed to start: ${err.message}`);
    process.exit(1);
  }
  console.log(`✅ Server running on http://localhost:${config.port} [${config.env}]`);
});