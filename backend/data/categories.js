const now = () => new Date().toISOString();

export const categories = [
  // --- RASHODI (expense) ---
  { id: 1,  name: 'Hrana',       type: 'expense', icon: '🍔', isDefault: true, userId: null, createdAt: now() },
  { id: 2,  name: 'Stanovanje',  type: 'expense', icon: '🏠', isDefault: true, userId: null, createdAt: now() },
  { id: 3,  name: 'Transport',   type: 'expense', icon: '🚗', isDefault: true, userId: null, createdAt: now() },
  { id: 4,  name: 'Zdravlje',    type: 'expense', icon: '💊', isDefault: true, userId: null, createdAt: now() },
  { id: 5,  name: 'Zabava',      type: 'expense', icon: '🎬', isDefault: true, userId: null, createdAt: now() },
  { id: 6,  name: 'Kupovina',    type: 'expense', icon: '🛒', isDefault: true, userId: null, createdAt: now() },
  { id: 7,  name: 'Pretplate',   type: 'expense', icon: '📱', isDefault: true, userId: null, createdAt: now() },
  { id: 8,  name: 'Režije',      type: 'expense', icon: '💡', isDefault: true, userId: null, createdAt: now() },
  // --- PRIHODI (income) ---
  { id: 9,  name: 'Plata',       type: 'income',  icon: '💼', isDefault: true, userId: null, createdAt: now() },
  { id: 10, name: 'Bonus',       type: 'income',  icon: '💰', isDefault: true, userId: null, createdAt: now() },
  { id: 11, name: 'Poklon',      type: 'income',  icon: '🎁', isDefault: true, userId: null, createdAt: now() },
  { id: 12, name: 'Investicije', type: 'income',  icon: '📈', isDefault: true, userId: null, createdAt: now() },
  { id: 13, name: 'Freelance',   type: 'income',  icon: '🔧', isDefault: true, userId: null, createdAt: now() },
];

// Seed nije prazan → Math.max je bezbedan. Guard držimo iz navike (konzistentnost sa transactions).
let _nextId = categories.length > 0
  ? Math.max(...categories.map(c => c.id)) + 1
  : 1;

export function getNextId() {
  return _nextId++;
}