// routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { DEFAULT_CATEGORIES } from '../constants/categories.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { config } from '../config.js';
import { toUserDTO } from '../utils/sanitize.js';
import { RegisterSchema, LoginSchema } from '../schemas/auth.js';
import { UnauthorizedError, ForbiddenError, ConflictError } from '../errors/ApiError.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

// Timing-attack zaštita: validan bcrypt hash sa ISTIM cost-om kao pravi.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-dummy-password', config.bcrypt.cost);

const router = Router();

// POST /auth/register
router.post('/register',
  authLimiter,
  validateBody(RegisterSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Email zauzet? (lepa 409 greška za uobičajen slučaj)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('EMAIL_EXISTS', 'Email already registered');
    }

    // 2. Hash (async — ne blokira event loop)
    const passwordHash = await bcrypt.hash(password, config.bcrypt.cost);

    // 3. User + njegovih 13 kategorija u JEDNOJ transakciji (nested write).
    //    Ako insert kategorija pukne, ni user ne ostaje u bazi.
    //    role i isActive dolaze iz @default u schemi.
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: {
          createMany: { data: DEFAULT_CATEGORIES },
        },
      },
    });

    // 4. JWT za auto-login — sub je SADA id iz baze
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({ user: toUserDTO(newUser), token });
  })
);

// POST /auth/login
router.post('/login',
  authLimiter,
  validateBody(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Nađi usera (email je @unique → findUnique koristi User_email_key indeks)
    const user = await prisma.user.findUnique({ where: { email } });

    // 2. Timing — uvek jedan compare sa validnim hash-om
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const validPassword = await bcrypt.compare(password, hashToCompare);

    // 3. Generička greška — ne otkriva da li je email ili lozinka pogrešna
    if (!user || !validPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Deaktiviran nalog — tek POSLE provere lozinke
    //    (inače 403 vs 401 otkriva da nalog postoji bez znanja lozinke)
    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated');
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ user: toUserDTO(user), token });
  })
);

// GET /auth/me — SVEŽ user iz baze, ne JWT payload
router.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    // select: passwordHash nikad ne napušta bazu
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
    });

    // Token validan, ali user obrisan/deaktiviran → sesija više ne važi
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Session no longer valid');
    }

    res.json({ user });
  })
);

export default router;