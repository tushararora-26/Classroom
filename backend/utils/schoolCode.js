import crypto from 'crypto';
import { School } from '../models/schoolSchema.js';

// Ambiguous characters (0/O, 1/I) are excluded because the code is read off a
// screen and typed by hand at signup.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 6;
const MAX_ATTEMPTS = 10;

const randomCode = () => {
  const bytes = crypto.randomBytes(LENGTH);
  let code = '';
  for (let i = 0; i < LENGTH; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
};

export const generateUniqueSchoolCode = async () => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = randomCode();
    const taken = await School.exists({ code });
    if (!taken) return code;
  }
  throw new Error('Could not generate a unique school code');
};
