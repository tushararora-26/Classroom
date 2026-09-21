import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { app, as } from './helpers/app.js';
import { makeSchool, makeTeacher, makeStudent } from './helpers/factories.js';
import { Admin } from '../models/adminRegisterSchema.js';
import { School } from '../models/schoolSchema.js';

beforeAll(async () => {
  await connectTestDb();
  await Admin.syncIndexes();
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

const authed = async () => {
  const res = await registerAdmin();
  return { token: res.body.token, admin: res.body.user, school: res.body.school };
};

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/v1/admin/me', () => {
  it('returns the admin and their school', async () => {
    const { token, school } = await authed();

    const res = await request(app).get('/api/v1/admin/me').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.admin.email).toBe('admin@example.com');
    expect(res.body.school.code).toBe(school.code);
    expect(JSON.stringify(res.body)).not.toContain('password1');
  });

  it('rejects a teacher with 403', async () => {
    const schoolDoc = await makeSchool();
    const teacher = await makeTeacher(schoolDoc);

    const res = await request(app).get('/api/v1/admin/me').set(as(teacher));

    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/admin/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/admin/me', () => {
  it('changes the name without needing the current password', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ name: 'Ratan Gulati' });

    expect(res.status).toBe(200);
    expect(res.body.admin.name).toBe('Ratan Gulati');
  });

  it('leaves the password untouched when it is not supplied', async () => {
    const { token, admin } = await authed();

    const before = (await Admin.findById(admin._id).select('+password')).password;

    await request(app).put('/api/v1/admin/me').set(bearer(token)).send({ name: 'Renamed' });

    const after = (await Admin.findById(admin._id).select('+password')).password;
    expect(after).toBe(before);
  });

  it('changes the password when the current one is given, and the old one stops working', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ password: 'newpassword1', currentPassword: 'password1' });

    expect(res.status).toBe(200);

    const withNew = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'admin@example.com', password: 'newpassword1' });
    expect(withNew.status).toBe(200);

    const withOld = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'admin@example.com', password: 'password1' });
    expect(withOld.status).toBe(401);
  });

  it('refuses a password change with no current password', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ password: 'newpassword1' });

    expect(res.status).toBe(400);
  });

  it('refuses a password change when the current password is wrong', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ password: 'newpassword1', currentPassword: 'notitatall' });

    expect(res.status).toBe(401);
  });

  it('changes the email and lets the admin sign in with it', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ email: 'new@example.com', currentPassword: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body.admin.email).toBe('new@example.com');

    const signin = await request(app)
      .post('/api/v1/admin/signin')
      .send({ email: 'new@example.com', password: 'password1' });

    expect(signin.status).toBe(200);
  });

  it('refuses an email change with no current password', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(400);
  });

  it('refuses an email already used by another admin', async () => {
    await registerAdmin({ email: 'taken@example.com', schoolName: 'Other High' });
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ email: 'taken@example.com', currentPassword: 'password1' });

    expect(res.status).toBe(409);
  });

  it('allows resubmitting the same email without a current password', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ name: 'Ratan G', email: 'admin@example.com' });

    expect(res.status).toBe(200);
  });

  it('rejects an invalid email with 400', async () => {
    const { token } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(bearer(token))
      .send({ email: 'not-an-email', currentPassword: 'password1' });

    expect(res.status).toBe(400);
  });

  it('rejects a student with 403', async () => {
    const schoolDoc = await makeSchool();
    const student = await makeStudent(schoolDoc);

    const res = await request(app)
      .put('/api/v1/admin/me')
      .set(as(student))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/admin/school', () => {
  it('renames the school but keeps the join code', async () => {
    const { token, school } = await authed();

    const res = await request(app)
      .put('/api/v1/admin/school')
      .set(bearer(token))
      .send({ name: 'Springfield Secondary' });

    expect(res.status).toBe(200);
    expect(res.body.school.name).toBe('Springfield Secondary');
    expect(res.body.school.code).toBe(school.code);
  });

  it('requires a name', async () => {
    const { token } = await authed();

    const res = await request(app).put('/api/v1/admin/school').set(bearer(token)).send({ name: '  ' });

    expect(res.status).toBe(400);
  });

  it('only ever renames the calling admin\'s own school', async () => {
    const other = await registerAdmin({ email: 'b@example.com', schoolName: 'Untouched High' });
    const { token } = await authed();

    await request(app)
      .put('/api/v1/admin/school')
      .set(bearer(token))
      .send({ name: 'Mine Renamed' });

    const untouched = await School.findById(other.body.school._id);
    expect(untouched.name).toBe('Untouched High');
  });

  it('rejects a teacher with 403', async () => {
    const schoolDoc = await makeSchool();
    const teacher = await makeTeacher(schoolDoc);

    const res = await request(app)
      .put('/api/v1/admin/school')
      .set(as(teacher))
      .send({ name: 'Nope' });

    expect(res.status).toBe(403);
  });
});

describe('teacher and student self-service password changes', () => {
  it('a teacher can change their name without a password', async () => {
    const schoolDoc = await makeSchool();
    const teacher = await makeTeacher(schoolDoc);

    const res = await request(app)
      .put('/api/v1/teachers/me')
      .set(as(teacher))
      .send({ name: 'Renamed Teacher' });

    expect(res.status).toBe(200);
    expect(res.body.teacher.name).toBe('Renamed Teacher');
  });

  it('a teacher needs the current password to set a new one', async () => {
    const schoolDoc = await makeSchool();
    const teacher = await makeTeacher(schoolDoc);

    const missing = await request(app)
      .put('/api/v1/teachers/me')
      .set(as(teacher))
      .send({ password: 'newpassword1' });
    expect(missing.status).toBe(400);

    const wrong = await request(app)
      .put('/api/v1/teachers/me')
      .set(as(teacher))
      .send({ password: 'newpassword1', currentPassword: 'notitatall' });
    expect(wrong.status).toBe(401);

    const ok = await request(app)
      .put('/api/v1/teachers/me')
      .set(as(teacher))
      .send({ password: 'newpassword1', currentPassword: 'password1' });
    expect(ok.status).toBe(200);
  });

  it('a student needs the current password to set a new one', async () => {
    const schoolDoc = await makeSchool();
    const student = await makeStudent(schoolDoc);

    const missing = await request(app)
      .put('/api/v1/students/me')
      .set(as(student))
      .send({ password: 'newpassword1' });
    expect(missing.status).toBe(400);

    const ok = await request(app)
      .put('/api/v1/students/me')
      .set(as(student))
      .send({ password: 'newpassword1', currentPassword: 'password1' });
    expect(ok.status).toBe(200);
  });
});
