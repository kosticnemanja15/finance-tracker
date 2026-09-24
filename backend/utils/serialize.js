// utils/serialize.js — Prisma red → JSON ugovor koji frontend očekuje.
// Pravilo: promena baze ne sme da promeni oblik API odgovora.
// In-memory ugovor (pre Dana 8) je imao `type` na vrhu i `date` kao "YYYY-MM-DD".

export function serializeTransaction(t) {
  return {
    ...t,
    // Decimal → number
    amount: t.amount.toNumber(),
    // type se u bazi izvodi iz kategorije; vraćamo ga na vrh zbog ugovora.
    // Sve rute koje serijalizuju rade `include: { category: true }`.
    type: t.category?.type,
    // DateTime → "YYYY-MM-DD" (format koji koristi <input type="date">)
    date: t.date.toISOString().slice(0, 10),
  };
}

export function serializeTransactions(list) {
  return list.map(serializeTransaction);
}