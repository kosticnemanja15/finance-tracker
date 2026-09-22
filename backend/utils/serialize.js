// utils/serialize.js — Prisma → JSON-safe oblik na granici ka frontu
// Decimal (amount) se JSON-uje u string; front hoće number → .toNumber() ovde, na jednom mestu.

export function serializeTransaction(t) {
  return {
    ...t,
    amount: t.amount.toNumber(),   // Decimal → number
    // category ide kakva jeste (nema Decimal polja)
  };
}

export function serializeTransactions(list) {
  return list.map(serializeTransaction);
}