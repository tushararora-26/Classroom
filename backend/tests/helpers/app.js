import { buildApp } from '../../app.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

export const app = buildApp();

export const as = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

// Imported lazily to avoid a circular import through factories.
import { generateToken } from '../../utils/generateToken.js';

export function tokenFor(user) {
  return generateToken(user._id, user.role, user.school);
}
