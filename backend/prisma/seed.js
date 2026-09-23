// prisma/seed.js — puni bazu redosledom koji FK-ovi zahtevaju: users → categories → transactions
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';      // isti singleton → vidimo SQL i tokom seed-a
import { config } from '../config.js';
import { DEFAULT_CATEGORIES } from '../constants/categories.js';


const SEED_USERS = [
  { name: 'Ana',   email: 'ana@test.com',   role: 'admin' },
  { name: 'Marko', email: 'marko@test.com', role: 'user'  },
];

async function main() {
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
    //    amount je Decimal — ovde dajem broj, Prisma ga prihvata (o serijalizaciji ka frontu na Koraku 3).
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
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());   // skripta mora da zatvori konekciju, inače „visi"