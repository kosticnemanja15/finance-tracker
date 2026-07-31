// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

// Globalni limiter — blaži, za sve rute
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Auth limiter — strog, za login/register (brute-force meta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  limit: 5,                    // samo 5 pokušaja
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later', code: 'RATE_LIMITED' },
  skipSuccessfulRequests: true,  // ← ključno, vidi objašnjenje
});