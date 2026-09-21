import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv } from '../config/env.js';

describe('loadEnv', () => {
  let original;

  beforeEach(() => {
    original = { ...process.env };
  });

  afterEach(() => {
    process.env = original;
  });

  it('throws when MONGO_URL is missing', () => {
    delete process.env.MONGO_URL;
    process.env.JWT_SECRET = 'secret';
    expect(() => loadEnv()).toThrow(/MONGO_URL/);
  });

  it('throws when JWT_SECRET is missing', () => {
    process.env.MONGO_URL = 'mongodb://localhost:27017/test';
    delete process.env.JWT_SECRET;
    expect(() => loadEnv()).toThrow(/JWT_SECRET/);
  });

  it('applies defaults for optional variables', () => {
    process.env.MONGO_URL = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'secret';
    delete process.env.PORT;
    delete process.env.JWT_EXPIRES_IN;

    const env = loadEnv();

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('7d');
    expect(env.MONGO_URL).toBe('mongodb://localhost:27017/test');
  });
});
