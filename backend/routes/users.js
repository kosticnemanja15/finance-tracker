// routes/users.js
import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { validateParams, validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../errors/ApiError.js';
import { USER_PUBLIC_SELECT } from '../utils/sanitize.js';
import { UserIdParamSchema, UpdateUserSchema } from '../schemas/users.js';

const router = Router();

// Autorizacija PRE baze: admin sve, user samo sebe.
// Non-admin dobija 403 za svaki tuđi id, bez obzira da li postoji → nema enumeracije.
function assertCanAccessUser(targetId, reqUser) {
  const isAdmin = reqUser.role === 'admin';
  const isSelf = reqUser.id === targetId;
  if (!isAdmin && !isSelf) throw new ForbiddenError('Access denied');
  return { isAdmin, isSelf };
}

// GET / — svi korisnici (samo admin), uključujući deaktivirane
router.get('/', requireAuth, requireRole('admin'),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: USER_PUBLIC_SELECT,
      orderBy: { id: 'asc' },
    });
    res.json(users);
  })
);

// GET /:id — admin bilo koga, user samo sebe
router.get('/:id', requireAuth, validateParams(UserIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    assertCanAccessUser(id, req.user);

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundError('User not found');

    res.json(user);
  })
);

// PATCH /:id — user menja sebi name/email; role i isActive samo admin
router.patch('/:id', requireAuth, validateParams(UserIdParamSchema), validateBody(UpdateUserSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const { isAdmin, isSelf } = assertCanAccessUser(id, req.user);

    // Privilegovana polja — samo admin
    if (!isAdmin && (req.body.role !== undefined || req.body.isActive !== undefined)) {
      throw new ForbiddenError('You cannot change role or account status');
    }

    // Self-lockout: admin ne sme sebe da degradira ili deaktivira
    if (isSelf && (req.body.role === 'user' || req.body.isActive === false)) {
      throw new ForbiddenError('You cannot demote or deactivate your own account');
    }

    // req.body je već prošao Zod → sadrži SAMO name/email/role/isActive.
    // Nepoznata polja (npr. passwordHash) Zod izbacuje → zaštita od mass assignment-a.
    // Nepostojeći id → Prisma baca P2025 (mapiramo u koraku 5).
    const updated = await prisma.user.update({
      where: { id },
      data: req.body,
      select: USER_PUBLIC_SELECT,
    });

    res.json(updated);
  })
);

// DELETE /:id — SOFT delete (samo admin)
router.delete('/:id', requireAuth, requireRole('admin'), validateParams(UserIdParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;

    if (id === req.user.id) {
      throw new ForbiddenError('You cannot deactivate your own account');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    res.status(204).end();
  })
);

export default router;