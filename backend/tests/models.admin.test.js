import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { School } from '../models/schoolSchema.js';
import { Admin } from '../models/adminRegisterSchema.js';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const makeSchool = () =>
  School.create({ name: 'Springfield High', code: 'SPRING1' });

const makeAdmin = (school) =>
  Admin.create({
    name: 'Ratan',
    email: 'admin@example.com',
    password: 'hunter2000',
    school: school._id,
  });

describe('Admin model', () => {
  it('hashes the password on save', async () => {
    const school = await makeSchool();
    await makeAdmin(school);

    const stored = await Admin.findOne({ email: 'admin@example.com' }).select('+password');

    expect(stored.password).not.toBe('hunter2000');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('excludes the password from queries by default', async () => {
    const school = await makeSchool();
    await makeAdmin(school);

    const stored = await Admin.findOne({ email: 'admin@example.com' });

    expect(stored.password).toBeUndefined();
  });

  it('matches a correct password and rejects a wrong one', async () => {
    const school = await makeSchool();
    await makeAdmin(school);

    const stored = await Admin.findOne({ email: 'admin@example.com' }).select('+password');

    await expect(stored.matchPassword('hunter2000')).resolves.toBe(true);
    await expect(stored.matchPassword('wrong')).resolves.toBe(false);
  });

  it('does not re-hash the password when another field changes', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const before = (await Admin.findById(admin._id).select('+password')).password;

    admin.name = 'Ratan Gulati';
    await admin.save();

    const after = (await Admin.findById(admin._id).select('+password')).password;

    expect(after).toBe(before);
  });

  it('rejects an invalid email', async () => {
    const school = await makeSchool();
    await expect(
      Admin.create({
        name: 'Ratan',
        email: 'not-an-email',
        password: 'hunter2000',
        school: school._id,
      })
    ).rejects.toThrow();
  });

  it('rejects a password shorter than 8 characters', async () => {
    const school = await makeSchool();
    await expect(
      Admin.create({
        name: 'Ratan',
        email: 'admin@example.com',
        password: 'short',
        school: school._id,
      })
    ).rejects.toThrow();
  });
});

describe('School model', () => {
  it('uppercases the code and enforces uniqueness', async () => {
    const school = await School.create({ name: 'Springfield High', code: 'spring1' });
    expect(school.code).toBe('SPRING1');

    await School.syncIndexes();
    await expect(School.create({ name: 'Other', code: 'SPRING1' })).rejects.toThrow();
  });
});
