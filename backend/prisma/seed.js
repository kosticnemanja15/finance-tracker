// prisma/seed.js — puni bazu redosledom koji FK-ovi zahtevaju: users → categories → transactions
//
// ⚠️ Seed BRIŠE sve podatke. Zaštita u dva sloja (assertSafeToSeed):
//   1. Remote baza → odbija, osim ako je ALLOW_REMOTE_SEED tačno jednak hostu baze.
//      (Mora se otkucati ime mete, kao kod brisanja GitHub repoa. Zaostala
//       varijabla tipa ALLOW_REMOTE_SEED=1 ne otključava ništa.)
//   2. Remote baza sa pravim korisnicima (email van SEED_USERS) → odbija uvek.
//      Demo se sme resetovati, live korisnici se ne smeju obrisati.
//
// Lokalno:  npx prisma db seed
// Neon:     ALLOW_REMOTE_SEED=<host> DATABASE_URL=... DIRECT_URL=... npx prisma db seed
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';      // isti singleton → vidimo SQL i tokom seed-a
import { config } from '../config.js';
import { DEFAULT_CATEGORIES } from '../constants/categories.js';


const SEED_USERS = [
  { name: 'Ana',   email: 'ana@test.com',   role: 'admin' },
  { name: 'Marko', email: 'marko@test.com', role: 'user'  },
];

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

function getDbHost() {
  try {
    return new URL(process.env.DATABASE_URL).hostname;
  } catch {
    return null;
  }
}

async function assertSafeToSeed() {
  const host = getDbHost();
  console.log(`🎯 Seed target: ${host ?? '(nevažeći DATABASE_URL)'}`);

  if (!host) {
    throw new Error('DATABASE_URL nije postavljen ili nije validan URL');
  }

  if (LOCAL_HOSTS.includes(host)) return;   // lokalno: reset je uvek dozvoljen

  // Sloj 1 — eksplicitna dozvola za TAČNO ovaj host. Proverava se PRE bilo kog upita.
  if (process.env.ALLOW_REMOTE_SEED !== host) {
    throw new Error(
      `Odbijeno: remote baza (${host}). Za namerni seed postavi ALLOW_REMOTE_SEED=${host}`
    );
  }

  // Sloj 2 — postoje li korisnici koje seed nije napravio?
  const realUsers = await prisma.user.count({
    where: { email: { notIn: SEED_USERS.map(u => u.email) } },
  });
  if (realUsers > 0) {
    throw new Error(
      `Odbijeno: baza ima ${realUsers} korisnika van seed-a. Seed bi ih obrisao.`
    );
  }
}

async function main() {
  await assertSafeToSeed();

  // 1. Čisto stanje — brišemo OBRNUTIM redosledom FK-ova (transactions → categories → users).
  //    Da probaš da obrišeš usere prve, FK Restrict/Cascade bi se pobunio ili kaskadno rušio.
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', config.bcrypt.cost);

  for (const u of SEED_USERS) {
    // 2. User (create → INSERT ... RETURNING, dobijamo nazad id)
    const user = await prisma.user.create({
      data: { ...u, passwordHash },   // schema polje je passwordHash (camelCase), ne password_hash
    });

    // 3. 13 kategorija za tog usera (createMany → JEDAN bulk INSERT sa više VALUES redova)
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user.id })),
    });

    // 4. Učitaj nazad kategorije — createMany NE vraća redove, a trebaju nam id-jevi za transakcije
    const cats = await prisma.category.findMany({ where: { userId: user.id } });
    const catId = Object.fromEntries(cats.map(c => [c.name, c.id]));  // { Food: 3, Salary: 9, ... }

    // 5. Par transakcija — referenciraju SAMO kategorije TOG usera (FK Restrict na categoryId).
    //    Napomena: Transaction u schemi NEMA `type` — tip se izvodi iz category.type (bitno za /stats).
    //    amount je Decimal — ovde dajem broj, Prisma ga prihvata.
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, categoryId: catId['Salary'],        amount: 2500.00, description: 'Monthly salary',   date: new Date('2026-01-05') },
        { userId: user.id, categoryId: catId['Freelance'],     amount: 800.00,  description: 'Website project',   date: new Date('2026-01-12') },
        { userId: user.id, categoryId: catId['Food'],          amount: 45.50,   description: 'Groceries',         date: new Date('2026-01-15') },
        { userId: user.id, categoryId: catId['Transport'],     amount: 60.00,   description: 'Gas',               date: new Date('2026-02-03') },
        { userId: user.id, categoryId: catId['Entertainment'], amount: 25.00,   description: 'Cinema',            date: new Date('2026-02-10') },
      ],
    });
  }
}

main()
  .then(async () => {
    const [uc, cc, tc] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.transaction.count(),
    ]);
    console.log(`\n✅ Seed done: ${uc} users, ${cc} categories, ${tc} transactions`);
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());   // skripta mora da zatvori konekciju, inače „visi"