import dotenv from "dotenv";

dotenv.config({ quiet: true });

const env = process.env.NODE_ENV || 'development';

// Uvek obavezne. DIRECT_URL je ovde jer ga schema.prisma traži (env("DIRECT_URL")).
const required = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'BCRYPT_COST', 'DATABASE_URL', 'DIRECT_URL'];

// Samo u produkciji. Lokalno je CORS '*', pa FRONTEND_URL nije potreban.
const requiredInProduction = ['FRONTEND_URL'];

const missing = [
  ...required,
  ...(env === 'production' ? requiredInProduction : []),
].filter((key) => !process.env[key]);

if (missing.length > 0) {
  for (const key of missing) console.error(`❌ Missing required env var: ${key}`);
  process.exit(1);
}

// FRONTEND_URL → čist origin (šema + host + port, bez '/' na kraju).
// Browser šalje Origin bez kose crte: "https://x.vercel.app/" ≠ "https://x.vercel.app" → CORS pada.
function toOrigin(value) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    console.error(`❌ Invalid FRONTEND_URL: ${value}`);
    process.exit(1);
  }
}

// Broj proxy hopova ispred aplikacije (koristi se samo u produkciji).
// Meri se, ne pogađa: premalo → req.ip je proxy; previše → klijent lažira IP kroz X-Forwarded-For.
const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 1) {
  console.error(`❌ Invalid TRUST_PROXY_HOPS: ${process.env.TRUST_PROXY_HOPS}`);
  process.exit(1);
}

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  bcrypt: {
    cost: parseInt(process.env.BCRYPT_COST, 10),
  },
  port: parseInt(process.env.PORT || '3000', 10),
  env,
  frontendUrl: toOrigin(process.env.FRONTEND_URL),
  trustProxyHops,
};