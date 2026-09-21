import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { app, as } from './helpers/app.js';
import { makeSchool, makeAdmin, makeTeacher, makeStudent, makeClass } from './helpers/factories.js';
import { Student } from '../models/studentSchema.js';
import { Assignment } from '../models/assignmentSchema.js';
import { Submission } from '../models/submissionSchema.js';

beforeAll(async () => {
  await connectTestDb();
  await Submission.syncIndexes();
});
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const scenario = async ({ deadline = '2099-01-01' } = {}) => {
  const school = await makeSchool();
  const admin = await makeAdmin(school);
  const teacher = await makeTeacher(school);
  const student = await makeStudent(school);
  const klass = await makeClass(school, {
    teachers: [teacher._id],
    students: [student._id],
  });
  await Student.updateOne({ _id: student._id }, { $set: { class: klass._id } });
  student.class = klass._id;

  const assignment = await Assignment.create({
    title: 'Essay',
    description: 'Write 500 words',
    class: klass._id,
    teacher: teacher._id,
    school: school._id,
    deadline: new Date(deadline),
  });

  return { school, admin, teacher, student, klass, assignment };
};

describe('student submitting', () => {
  it('creates a submission', async () => {
    const { student, assignment } = await scenario();

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'My essay' });

    expect(res.status).toBe(201);
    expect(res.body.submission.content).toBe('My essay');
  });

  it('replaces the previous submission rather than duplicating', async () => {
    const { student, assignment } = await scenario();

    await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'First attempt' });

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Second attempt' });

    expect(res.status).toBe(201);
    expect(res.body.submission.content).toBe('Second attempt');
    await expect(Submission.countDocuments({ assignment: assignment._id })).resolves.toBe(1);
  });

  it('clears a previous grade when re-submitting', async () => {
    const { teacher, student, assignment } = await scenario();

    const first = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'First' });

    await request(app)
      .patch(`/api/v1/submissions/${first.body.submission._id}/grade`)
      .set(as(teacher))
      .send({ grade: 'A', feedback: 'Good' });

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Second' });

    expect(res.body.submission.grade).toBeNull();
    expect(res.body.submission.feedback).toBe('');
  });

  it('requires some content or a file link', async () => {
    const { student, assignment } = await scenario();

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({});

    expect(res.status).toBe(400);
  });

  it('refuses a submission after the deadline with 409', async () => {
    const { student, assignment } = await scenario({ deadline: '2020-01-01' });

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Late' });

    expect(res.status).toBe(409);
  });

  it('refuses a submission from a student in another class', async () => {
    const { school, assignment } = await scenario();
    const outsider = await makeStudent(school);

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(outsider))
      .send({ content: 'Not mine' });

    expect(res.status).toBe(403);
  });

  it('blocks a teacher from submitting', async () => {
    const { teacher, assignment } = await scenario();

    const res = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(teacher))
      .send({ content: 'x' });

    expect(res.status).toBe(403);
  });
});

describe('teacher viewing and grading', () => {
  it('lists submissions and who is still missing', async () => {
    const { school, teacher, student, klass, assignment } = await scenario();
    const second = await makeStudent(school, { class: klass._id });
    await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(await makeAdmin(school)))
      .send({ registrationNumber: second.registrationNumber });

    await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Done' });

    const res = await request(app)
      .get(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(teacher));

    expect(res.status).toBe(200);
    expect(res.body.submissions).toHaveLength(1);
    expect(res.body.missing.map((s) => s._id)).toContain(second._id.toString());
  });

  it('grades a submission and stamps who graded it', async () => {
    const { teacher, student, assignment } = await scenario();

    const submitted = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Done' });

    const res = await request(app)
      .patch(`/api/v1/submissions/${submitted.body.submission._id}/grade`)
      .set(as(teacher))
      .send({ grade: 'A', feedback: 'Well argued' });

    expect(res.status).toBe(200);
    expect(res.body.submission.grade).toBe('A');
    expect(res.body.submission.gradedBy).toBe(teacher._id.toString());
    expect(res.body.submission.gradedAt).toBeTruthy();
  });

  it('blocks a different teacher from grading', async () => {
    const { school, student, assignment } = await scenario();
    const other = await makeTeacher(school);

    const submitted = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Done' });

    const res = await request(app)
      .patch(`/api/v1/submissions/${submitted.body.submission._id}/grade`)
      .set(as(other))
      .send({ grade: 'F' });

    expect(res.status).toBe(403);
  });

  it('blocks a student from grading', async () => {
    const { student, assignment } = await scenario();

    const submitted = await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Done' });

    const res = await request(app)
      .patch(`/api/v1/submissions/${submitted.body.submission._id}/grade`)
      .set(as(student))
      .send({ grade: 'A+' });

    expect(res.status).toBe(403);
  });

  it('blocks a student from listing everyone\'s submissions', async () => {
    const { student, assignment } = await scenario();

    const res = await request(app)
      .get(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student));

    expect(res.status).toBe(403);
  });
});

describe('student assignment list', () => {
  it('includes the student\'s own submission state', async () => {
    const { student, assignment } = await scenario();

    const before = await request(app).get('/api/v1/students/me/assignments').set(as(student));
    expect(before.body.assignments[0].submission).toBeNull();

    await request(app)
      .post(`/api/v1/assignments/${assignment._id}/submissions`)
      .set(as(student))
      .send({ content: 'Done' });

    const after = await request(app).get('/api/v1/students/me/assignments').set(as(student));
    expect(after.body.assignments[0].submission.content).toBe('Done');
  });

  it('returns an empty list for a student with no class', async () => {
    const school = await makeSchool();
    const loner = await makeStudent(school);

    const res = await request(app).get('/api/v1/students/me/assignments').set(as(loner));

    expect(res.status).toBe(200);
    expect(res.body.assignments).toEqual([]);
  });
});
