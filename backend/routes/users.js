import { Router } from 'express';
import { users } from '../data/users.js';
import { validateParams, validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../errors/ApiError.js';
import { toUserDTO, toUsersDTO } from '../utils/sanitize.js';
import { UserIdParamSchema, UpdateUserSchema } from '../schemas/users.js';


const router = Router();

// GET /users — lista svih user-a (SAMO admin)
router.get('/',
  requireAuth,                    // 1. ulogovan?
  requireRole('admin'),           // 2. admin?
  asyncHandler(async (req, res) => {
    res.json(toUsersDTO(users));  // 3. DTO na ceo niz — bez password_hash
  })
);

// GET /users/:id — admin vidi bilo koga, user vidi samo sebe
router.get('/:id',
  requireAuth,                          // 1. ulogovan?
  validateParams(UserIdParamSchema),    // 2. validan :id?
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    // 3. Nađi user-a
    const user = users.find(u => u.id === id);
    if (!user) throw new NotFoundError('User not found');

    // 4. OWNERSHIP CHECK — jezgro pattern-a
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === user.id;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenError('Access denied');
    }

    // 5. DTO
    res.json(toUserDTO(user));
  })
);

// PATCH /users/:id — ownership + privilegovana polja samo admin
router.patch('/:id',
  requireAuth,
  validateParams(UserIdParamSchema),
  validateBody(UpdateUserSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    // 1. Nađi
    const user = users.find(u => u.id === id);
    if (!user) throw new NotFoundError('User not found');

    // 2. Ownership — admin ili sam
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === user.id;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenError('Access denied');
    }

    // 3. Pattern 1 — role/isActive sme SAMO admin
    if (!isAdmin && (req.body.role !== undefined || req.body.isActive !== undefined)) {
      throw new ForbiddenError('You cannot change role or account status');
    }

    // 4. Primeni izmene (req.body je već očišćen Zod-om)
    Object.assign(user, req.body);

    // 5. DTO
    res.json(toUserDTO(user));
  })
);

// DELETE /users/:id — soft delete (samo admin)
router.delete('/:id',
  requireAuth,
  requireRole('admin'),
  validateParams(UserIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    const user = users.find(u => u.id === id);
    if (!user) throw new NotFoundError('User not found');

    // Soft delete — ne brišemo, deaktiviramo
    user.isActive = false;

    res.status(204).end();
  })
);

export default router;