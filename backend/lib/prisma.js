// lib/prisma.js — singleton PrismaClient + query logging (ESM)
import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

// Produkcija: loguje se samo SPOR upit, bez parametara.
// PARAMS sadrže email, passwordHash, iznose → u logovima su curenje podataka (GDPR).
// Isti princip kao Postgres log_min_duration_statement.
const SLOW_QUERY_MS = 200;

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
  });

prisma.$on('query', (e) => {
  if (isProduction) {
    if (e.duration >= SLOW_QUERY_MS) {
      console.warn(`🐢 SLOW SQL (${e.duration}ms): ${e.query}`);
    }
    return;
  }

  console.log('🔵 SQL   :', e.query);
  console.log('🟡 PARAMS:', e.params);
  console.log('⏱  TIME :', e.duration + 'ms');
  console.log('─'.repeat(70));
});

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;