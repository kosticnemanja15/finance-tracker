import { Router } from 'express';
import bcrypt from 'bcrypt';
import { users, getNextId } from '../data/users.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { config } from '../config.js';
import { toUserDTO } from '../utils/sanitize.js'; 
import { RegisterSchema , LoginSchema } from '../schemas/auth.js';
import { UnauthorizedError, ForbiddenError , ConflictError } from '../errors/ApiError.js';
import { requireAuth } from '../middleware/auth.js';


const router = Router();

// POST /auth/register
router.post('/register',
  validateBody(RegisterSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    
    // 1. Proveri da email ne postoji
    const existing = users.find(u => u.email === email);
    if (existing) {
      throw new ConflictError('EMAIL_EXISTS', 'Email already registered');
    }
    
    // 2. Hash password (async — ne blokira event loop)
    const password_hash = await bcrypt.hash(password, config.bcrypt.cost);
    
    // 3. Kreiraj user
    const newUser = {
      id: getNextId(),
      name,
      email,
      password_hash,
      role:'user',
      isActive:true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    
    // 4. Generiši JWT za auto-login
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    
    // 5. DTO newUser
    res.status(201).json({
      user: toUserDTO(newUser),
      token,
    });
  })
);

// POST /auth/login
router.post('/login',
  validateBody(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Nađi user-a
    const user = users.find(u => u.email === email);

    // 2. Timing attack protection — UVEK pozovi bcrypt.compare,
    //    čak i kad user ne postoji (dummy hash), da vreme odgovora bude isto
    const validPassword = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, '$2b$10$dummy.hash.for.timing.consistency.fake');

    // 3. Generička greška — ne otkrivaj DA LI je email ili password pogrešan
    if (!user || !validPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Deaktiviran nalog — TEK POSLE provere lozinke
    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated');
    }

    // 5. Token + DTO
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: toUserDTO(user),
      token,
    });
  })
);


// GET /auth/me
router.get('/me',
  requireAuth,
  (req, res) => {
    res.json({ user: req.user });
  }
);


export default router;