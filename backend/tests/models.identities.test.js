import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { School } from '../models/schoolSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import { Student } from '../models/studentSchema.js';

beforeAll(async () => {
  await connectTestDb();
  await Teacher.syncIndexes();
  await Student.syncIndexes();
});
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('Student model', () => {
  it('hashes the password and can match it', async () => {
    const school = await School.create({ name: 'A', code: 'AAA' });
    await Student.create({
      name: 'Asha',
      registrationNumber: '2201',
      password: 'password1',
      school: school._id,
    });

    const stored = await Student.findOne({ registrationNumber: '2201' }).select('+password');

    expect(stored.password).not.toBe('password1');
    await expect(stored.matchPassword('password1')).resolves.toBe(true);
  });

  it('defaults class to null', async () => {
    const school = await School.create({ name: 'A', code: 'AAA' });
    const student = await Student.create({
      name: 'Asha',
      registrationNumber: '2201',
      password: 'password1',
      school: school._id,
    });

    expect(student.class).toBeNull();
  });

  it('allows the same registration number in two different schools', async () => {
    const a = await School.create({ name: 'A', code: 'AAA' });
    const b = await School.create({ name: 'B', code: 'BBB' });

    await Student.create({
      name: 'Asha',
      registrationNumber: '2201',
      password: 'password1',
      school: a._id,
    });

    await expect(
      Student.create({
        name: 'Dev',
        registrationNumber: '2201',
        password: 'password1',
        school: b._id,
      })
    ).resolves.toBeDefined();
  });

  it('rejects a duplicate registration number within one school', async () => {
    const a = await School.create({ name: 'A', code: 'AAA' });

    await Student.create({
      name: 'Asha',
      registrationNumber: '2201',
      password: 'password1',
      school: a._id,
    });

    await expect(
      Student.create({
        name: 'Dev',
        registrationNumber: '2201',
        password: 'password1',
        school: a._id,
      })
    ).rejects.toThrow();
  });
});

describe('Teacher model', () => {
  it('allows the same email in two different schools', async () => {
    const a = await School.create({ name: 'A', code: 'AAA' });
    const b = await School.create({ name: 'B', code: 'BBB' });

    await Teacher.create({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      school: a._id,
    });

    await expect(
      Teacher.create({
        name: 'Meera',
        email: 'meera@example.com',
        subject: 'Physics',
        password: 'password1',
        school: b._id,
      })
    ).resolves.toBeDefined();
  });

  it('rejects a duplicate email within one school', async () => {
    const a = await School.create({ name: 'A', code: 'AAA' });

    await Teacher.create({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      school: a._id,
    });

    await expect(
      Teacher.create({
        name: 'Other',
        email: 'meera@example.com',
        subject: 'Physics',
        password: 'password1',
        school: a._id,
      })
    ).rejects.toThrow();
  });
});
