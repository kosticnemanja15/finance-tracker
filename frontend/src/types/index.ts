// Centralni tipovi — OGLEDALO API ugovora (backend, Prisma/Postgres verzija).
// Pravilo: tip opisuje ono što API stvarno šalje. TypeScript ne proverava
// podatke u runtime-u — lažno polje u tipu = undefined u browseru bez greške.

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

// A1 model: svaki korisnik ima SVOJU kopiju kategorija (13 pri registraciji).
// Nema sistemskih kategorija → nema isDefault, icon, createdAt; userId nikad null.
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  userId: number;
}

export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  type: 'income' | 'expense';  // backend ga izvodi iz category.type
  amount: number;              // uvek pozitivan; type određuje smer
  description: string;
  date: string;                // "YYYY-MM-DD"
  createdAt: string;           // ISO
  category: Category;          // backend uvek vraća ugnežđenu kategoriju
}

// GET /transactions vraća { data, pagination } — za razliku od categories
export interface Pagination {
  page: number;
  total: number;
  hasMore: boolean;
}