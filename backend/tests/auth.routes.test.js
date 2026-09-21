import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { buildApp } from '../app.js';
import { Admin } from '../models/adminRegisterSchema.js';
import { Student } from '../models/studentSchema.js';
import { School } from '../models/schoolSchema.js';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = buildApp();

beforeAll(async () => {
  await connectTestDb();
  await Admin.syncIndexes();
  await Student.syncIndexes();
  await School.syncIndexes();
});
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const registerAdmin = (overrides = {}) =>
  request(app)
    .post('/api/v1/admin/register')
    .send({
      name: 'Ratan',
      email: 'admin@example.com',
      password: 'password1',
      schoolName: 'Springfield High',
      ...overrides,
    });

describe('POST /api/v1/admin/register', () => {
  it('creates a school, returns a token and never returns the password', async () => {
    const res = await registerAdmin();

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.school.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(JSON.stringify(res.body)).not.toContain('password1');
  });

  it('rejects a duplicate admin email with 409', async () => {
    await registerAdmin();
    const res = await registerAdmin();

    expect(res.status).toBe(409);
  });

  it('does not leave an orphaned school when the admin is invalid', async () => {
    const res = await registerAdmin({ password: 'short' });

    expect(res.status).toBe(400);
    await expect(School.countDocuments()).resolves.toBe(0);
  });

  it('requires every field', async () => {
    const res = await request(app)
      .post('/api/v1/admin/register')
      .send({ email: 'a@example.com', password: 'password1' });

    expect(res.status).toBe(400);
  });

  it('issues distinct school codes to different admins', async () => {
    const first = await registerAdmin();
    const second = await registerAdmin({ email: 'other@example.com' });

    expect(first.body.school.code).not.toBe(second.body.school.code);
  });
});

describe('POST /api/v1/admin/signin', () => {
  it('signs in with correct credentials', async () => {
    await registerAdmin();

    const res = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'admin@example.com', password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.school.name).toBe('Springfield High');
  });

  it('rejects a wrong password with 401', async () => {
    await registerAdmin();

    const res = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'admin@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('gives the same 401 for an unknown email, not a 404', async () => {
    const res = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'nobody@example.com', password: 'password1' });

    expect(res.status).toBe(401);
  });
});

describe('teacher signup and signin', () => {
  it('joins a school by code and can then sign in', async () => {
    const admin = await registerAdmin();
    const schoolCode = admin.body.school.code;

    const signup = await request(app).post('/api/v1/teachers/signup').send({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      schoolCode,
    });

    expect(signup.status).toBe(201);
    expect(signup.body.user.role).toBe('teacher');

    const signin = await request(app).post('/api/v1/teachers/signin').send({
      email: 'meera@example.com',
      password: 'password1',
      schoolCode,
    });

    expect(signin.status).toBe(200);
    expect(signin.body.token).toBeTruthy();
  });

  it('rejects an unknown school code with 404', async () => {
    const res = await request(app).post('/api/v1/teachers/signup').send({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      schoolCode: 'NOPE99',
    });

    expect(res.status).toBe(404);
  });

  it('accepts a lowercase school code', async () => {
    const admin = await registerAdmin();

    const res = await request(app).post('/api/v1/teachers/signup').send({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      schoolCode: admin.body.school.code.toLowerCase(),
    });

    expect(res.status).toBe(201);
  });

  it('will not sign in a teacher against the wrong school', async () => {
    const schoolA = await registerAdmin();
    const schoolB = await registerAdmin({ email: 'b@example.com', schoolName: 'B High' });

    await request(app).post('/api/v1/teachers/signup').send({
      name: 'Meera',
      email: 'meera@example.com',
      subject: 'Maths',
      password: 'password1',
      schoolCode: schoolA.body.school.code,
    });

    const res = await request(app).post('/api/v1/teachers/signin').send({
      email: 'meera@example.com',
      password: 'password1',
      schoolCode: schoolB.body.school.code,
    });

    expect(res.status).toBe(401);
  });
});

describe('student signup and signin', () => {
  it('joins a school by code and can then sign in', async () => {
    const admin = await registerAdmin();
    const schoolCode = admin.body.school.code;

    const signup = await request(app).post('/api/v1/students/signup').send({
      name: 'Asha',
      registrationNumber: '2201',
      password: 'password1',
      schoolCode,
    });

    expect(signup.status).toBe(201);

    const signin = await request(app).post('/api/v1/students/signin').send({
      registrationNumber: '2201',
      password: 'password1',
      schoolCode,
    });

    expect(signin.status).toBe(200);
    expect(signin.body.user.registrationNumber).toBe('2201');
  });
});

describe('GET /api/v1/me', () => {
  it('rehydrates a session from a token', async () => {
    const admin = await registerAdmin();

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${admin.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@example.com');
    expect(res.body.school.code).toBe(admin.body.school.code);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
