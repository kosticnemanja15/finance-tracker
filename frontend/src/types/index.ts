// Centralni tipovi. User ogledalo backend DTO-a (bez password_hash).
export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;              // npr. "🍔"
  isDefault: boolean;        // sistemske vs user-created
  userId: number | null;     // null za default
  createdAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  type: 'income' | 'expense';
  amount: number;        // uvek pozitivan; type određuje smer
  description: string;
  date: string;          // ISO
  createdAt: string;     // ISO
}

// GET /transactions vraća { data, pagination } — za razliku od categories
export interface Pagination {
  page: number;
  total: number;
  hasMore: boolean;
}