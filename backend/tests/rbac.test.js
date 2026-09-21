import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { app, as } from './helpers/app.js';
import {
  makeSchool,
  makeAdmin,
  makeTeacher,
  makeStudent,
  makeClass,
} from './helpers/factories.js';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('unauthenticated access', () => {
  const protectedRoutes = [
    ['get', '/api/v1/class/getall'],
    ['get', '/api/v1/students/getall'],
    ['get', '/api/v1/teachers/getall'],
    ['get', '/api/v1/events/getall'],
    ['get', '/api/v1/library/getall'],
    ['get', '/api/v1/announcement/getall'],
    ['get', '/api/v1/notices/getall'],
    ['get', '/api/v1/assignments/getall'],
    ['post', '/api/v1/class'],
    ['post', '/api/v1/events'],
  ];

  it.each(protectedRoutes)('rejects %s %s with 401', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});

describe('admin-only writes', () => {
  it('lets an admin create a class', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app)
      .post('/api/v1/class')
      .set(as(admin))
      .send({ class: 'Grade 10-A' });

    expect(res.status).toBe(201);
  });

  it('blocks a teacher from creating a class', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);

    const res = await request(app)
      .post('/api/v1/class')
      .set(as(teacher))
      .send({ class: 'Grade 10-A' });

    expect(res.status).toBe(403);
  });

  it('blocks a student from creating a class', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);

    const res = await request(app)
      .post('/api/v1/class')
      .set(as(student))
      .send({ class: 'Grade 10-A' });

    expect(res.status).toBe(403);
  });

  it('blocks a student from listing all students', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);

    const res = await request(app).get('/api/v1/students/getall').set(as(student));

    expect(res.status).toBe(403);
  });

  it('blocks a teacher from deleting a student', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);

    const res = await request(app)
      .delete(`/api/v1/students/${student._id}`)
      .set(as(teacher));

    expect(res.status).toBe(403);
  });

  it('blocks a teacher from reading another teacher by id', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const other = await makeTeacher(school);

    const res = await request(app).get(`/api/v1/teachers/${other._id}`).set(as(teacher));

    expect(res.status).toBe(403);
  });
});

describe('tenancy isolation', () => {
  it('does not list another school\'s classes', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    await makeClass(theirs, { class: 'Their Class' });
    await makeClass(mine, { class: 'My Class' });

    const res = await request(app).get('/api/v1/class/getall').set(as(admin));

    expect(res.status).toBe(200);
    expect(res.body.classes).toHaveLength(1);
    expect(res.body.classes[0].class).toBe('My Class');
  });

  it('does not list another school\'s students', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    await makeStudent(theirs);
    await makeStudent(mine);

    const res = await request(app).get('/api/v1/students/getall').set(as(admin));

    expect(res.body.students).toHaveLength(1);
  });

  it('returns 404 reading another school\'s student by id', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const outsider = await makeStudent(theirs);

    const res = await request(app)
      .get(`/api/v1/students/${outsider._id}`)
      .set(as(admin));

    expect(res.status).toBe(404);
  });

  it('refuses to delete another school\'s student', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const outsider = await makeStudent(theirs);

    const res = await request(app)
      .delete(`/api/v1/students/${outsider._id}`)
      .set(as(admin));

    expect(res.status).toBe(404);
  });

  it('refuses to update another school\'s class', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const klass = await makeClass(theirs);

    const res = await request(app)
      .put(`/api/v1/class/${klass._id}`)
      .set(as(admin))
      .send({ class: 'Hijacked' });

    expect(res.status).toBe(404);
  });

  it('cannot enrol a student from another school', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const klass = await makeClass(mine);
    const outsider = await makeStudent(theirs, { registrationNumber: 'OUTSIDE1' });

    const res = await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(admin))
      .send({ registrationNumber: 'OUTSIDE1' });

    expect(res.status).toBe(404);
  });

  it('cannot assign a teacher from another school', async () => {
    const mine = await makeSchool();
    const theirs = await makeSchool();
    const admin = await makeAdmin(mine);
    const klass = await makeClass(mine);
    const outsider = await makeTeacher(theirs);

    const res = await request(app)
      .post(`/api/v1/class/${klass._id}/teachers`)
      .set(as(admin))
      .send({ email: outsider.email });

    expect(res.status).toBe(404);
  });
});

describe('teacher scoping to own classes', () => {
  it('lists only the classes the teacher teaches', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    await makeClass(school, { teachers: [teacher._id], class: 'Mine' });
    await makeClass(school, { class: 'Someone else\'s' });

    const res = await request(app).get('/api/v1/teachers/me/classes').set(as(teacher));

    expect(res.status).toBe(200);
    expect(res.body.classes).toHaveLength(1);
    expect(res.body.classes[0].class).toBe('Mine');
  });

  it('blocks reading a class the teacher does not teach', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school);

    const res = await request(app)
      .get(`/api/v1/teachers/me/classes/${klass._id}`)
      .set(as(teacher));

    expect(res.status).toBe(403);
  });

  it('blocks marking attendance for a class the teacher does not teach', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, { students: [student._id] });

    const res = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(teacher))
      .send({ date: '2026-09-16', attendance: { [student._id]: true } });

    expect(res.status).toBe(403);
  });

  it('blocks a student from marking attendance at all', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);
    const klass = await makeClass(school, { students: [student._id] });

    const res = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(student))
      .send({ date: '2026-09-16', attendance: { [student._id]: true } });

    expect(res.status).toBe(403);
  });
});
