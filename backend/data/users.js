// data/users.js
import bcrypt from 'bcrypt';
import { config } from '../config.js';

const seedPassword = 'password123';

export const users = [
  {
    id: 1,
    name: 'Ana',
    email: 'ana@test.com',
    password_hash: bcrypt.hashSync(seedPassword, config.bcrypt.cost),  // ← poseban poziv
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 2,
    name: 'Marko',
    email: 'marko@test.com',
    password_hash: bcrypt.hashSync(seedPassword, config.bcrypt.cost),  // ← poseban poziv (novi salt)
    role: 'user',
    createdAt: new Date().toISOString(),
    isActive: true
  },
];

let _nextId = Math.max(...users.map(u => u.id)) + 1;

export function getNextId() {
  return _nextId++;
}