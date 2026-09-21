import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { makeSchool, makeAdmin, makeStudent, makeTeacher, makeClass, tokenFor } from './helpers/factories.js';
import { Admin } from '../models/adminRegisterSchema.js';
import { generateToken } from '../utils/generateToken.js';
import { protect, authorize, requireClassAccess } from '../middlewares/auth.js';
import { errorHandler } from '../middlewares/errorHandler.js';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const app = express();
app.get('/private', protect, (req, res) =>
  res.json({ id: req.user._id.toString(), role: req.user.role })
);
app.get('/admin-only', protect, authorize('admin'), (req, res) => res.json({ ok: true }));
app.get('/class/:classId', protect, requireClassAccess, (req, res) =>
  res.json({ class: req.classDoc.class })
);
app.use(errorHandler);

describe('protect', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/private');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/private').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('rejects a token whose user no longer exists', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const token = tokenFor(admin);
    await Admin.findByIdAndDelete(admin._id);

    const res = await request(app).get('/private').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('rejects a token whose school no longer matches the record', async () => {
    const school = await makeSchool();
    const other = await makeSchool();
    const admin = await makeAdmin(school);
    const staleToken = generateToken(admin._id, 'admin', other._id);

    const res = await request(app).get('/private').set('Authorization', `Bearer ${staleToken}`);

    expect(res.status).toBe(401);
  });

  it('attaches the user and role for a valid admin token', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app).get('/private').set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: admin._id.toString(), role: 'admin' });
  });

  it('loads a student from the student collection', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);

    const res = await request(app).get('/private').set('Authorization', `Bearer ${tokenFor(student)}`);

    expect(res.body.role).toBe('student');
  });
});

describe('authorize', () => {
  it('lets an admin through an admin-only route', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
  });

  it('blocks a student from an admin-only route with 403', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);

    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${tokenFor(student)}`);

    expect(res.status).toBe(403);
  });

  it('blocks a teacher from an admin-only route with 403', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);

    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${tokenFor(teacher)}`);

    expect(res.status).toBe(403);
  });
});

describe('requireClassAccess', () => {
  it('lets an admin read any class in their school', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const klass = await makeClass(school);

    const res = await request(app)
      .get(`/class/${klass._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
  });

  it('hides a class belonging to another school as 404', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const klass = await makeClass(theirs);

    const res = await request(app)
      .get(`/class/${klass._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(404);
  });

  it('lets a teacher read a class they teach', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school, { teachers: [teacher._id] });

    const res = await request(app)
      .get(`/class/${klass._id}`)
      .set('Authorization', `Bearer ${tokenFor(teacher)}`);

    expect(res.status).toBe(200);
  });

  it('blocks a teacher from a class they do not teach with 403', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school);

    const res = await request(app)
      .get(`/class/${klass._id}`)
      .set('Authorization', `Bearer ${tokenFor(teacher)}`);

    expect(res.status).toBe(403);
  });

  it('blocks a student from a class they are not enrolled in with 403', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);
    const klass = await makeClass(school);

    const res = await request(app)
      .get(`/class/${klass._id}`)
      .set('Authorization', `Bearer ${tokenFor(student)}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 for a malformed class id', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app)
      .get('/class/not-an-objectid')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(400);
  });
});
