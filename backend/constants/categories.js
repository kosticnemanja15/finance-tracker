// constants/categories.js
// Default set kategorija (A1 model: svaki user dobija SVOJU kopiju).
// Koriste ga: prisma/seed.js i routes/auth.js (register).
export const DEFAULT_CATEGORIES = [
  { name: 'Food',          type: 'expense' },
  { name: 'Housing',       type: 'expense' },
  { name: 'Transport',     type: 'expense' },
  { name: 'Health',        type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Shopping',      type: 'expense' },
  { name: 'Subscriptions', type: 'expense' },
  { name: 'Utilities',     type: 'expense' },
  { name: 'Salary',        type: 'income'  },
  { name: 'Bonus',         type: 'income'  },
  { name: 'Gift',          type: 'income'  },
  { name: 'Investments',   type: 'income'  },
  { name: 'Freelance',     type: 'income'  },
];