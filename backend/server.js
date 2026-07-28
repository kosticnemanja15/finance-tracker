import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './errors/ApiError.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

// Router importi — dodajemo od Dana 14
// import authRouter from './routes/auth.js';

const app = express();

// Middleware chain — redosled je bitan
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: config.env === 'production'
    ? ['https://finance-tracker.vercel.app'] // TODO: pravi URL u Danu 20
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

// Rute — mount-ujemo od Dana 14
app.use('/auth', authRouter);
app.use('/users', usersRouter); 


// 404 — sve što nije uhvatila nijedna ruta iznad
app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});



// Error handler MORA biti poslednji
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port} [${config.env}]`);
});