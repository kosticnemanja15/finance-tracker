// lib/prisma.js — singleton PrismaClient + query logging (ESM)
import { PrismaClient } from '@prisma/client';

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
  console.log('🔵 SQL   :', e.query);
  console.log('🟡 PARAMS:', e.params);
  console.log('⏱  TIME :', e.duration + 'ms');
  console.log('─'.repeat(70));
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;