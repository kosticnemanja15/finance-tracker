// middleware/errorHandler.js
import { Prisma } from '@prisma/client';
import { ApiError } from '../errors/ApiError.js';
import { config } from '../config.js';

// Prisma poznate greške → HTTP odgovor. null = nije mapirana, ide na 500.
function mapPrismaError(err) {
  switch (err.code) {
    // update/delete nije pogodio nijedan red
    // (ne postoji ILI ownership WHERE nije prošao — namerno isti odgovor)
    case 'P2025':
      return { status: 404, body: { error: 'Resource not found', code: 'NOT_FOUND' } };

    // unique constraint — meta.target = niz kolona, npr. ['email'] ili ['userId','name']
    case 'P2002': {
      const fields = (err.meta?.target ?? []).filter(f => f !== 'userId');
      return {
        status: 409,
        body: { error: `Already exists: ${fields.join(', ') || 'value'}`, code: 'DUPLICATE', fields },
      };
    }

    // foreign key — npr. brisanje kategorije koja ima transakcije
    case 'P2003':
      return {
        status: 409,
        body: { error: 'Resource is in use and cannot be deleted', code: 'IN_USE' },
      };

    default:
      return null;
  }
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { error: err.message, code: err.code };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON', code: 'INVALID_JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) return res.status(mapped.status).json(mapped.body);
    // nepoznat Prisma kod → pada na 500 ispod
  }

  console.log('Unexpected error:', err);
  const body = { error: 'Internal Server Error', code: 'INTERNAL' };
  if (config.env !== 'production') body.debug = { message: err.message, stack: err.stack };
  res.status(500).json(body);
}