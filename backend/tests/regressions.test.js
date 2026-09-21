import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { app, as } from './helpers/app.js';
import { makeSchool, makeAdmin, makeTeacher, makeStudent, makeClass } from './helpers/factories.js';
import { Student } from '../models/studentSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import { Class } from '../models/classSchema.js';
import { Attendance } from '../models/attendanceSchema.js';
import { Assignment } from '../models/assignmentSchema.js';
import { Notice } from '../models/noticeSchema.js';
import { Book } from '../models/librarySchema.js';

beforeAll(async () => {
  await connectTestDb();
  await Attendance.syncIndexes();
});
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('B5: library createBook used undefined variables', () => {
  it('persists the book name and author that were posted', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app)
      .post('/api/v1/library')
      .set(as(admin))
      .send({ bookname: 'Dune', author: 'Frank Herbert', copies: 3 });

    expect(res.status).toBe(201);
    expect(res.body.book.bookname).toBe('Dune');
    expect(res.body.book.author).toBe('Frank Herbert');
    expect(res.body.book.available).toBe(3);

    const stored = await Book.findOne({ bookname: 'Dune' });
    expect(stored.author).toBe('Frank Herbert');
  });

  it('searches by author', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    await request(app).post('/api/v1/library').set(as(admin)).send({ bookname: 'Dune', author: 'Frank Herbert' });
    await request(app).post('/api/v1/library').set(as(admin)).send({ bookname: 'Emma', author: 'Jane Austen' });

    const res = await request(app).get('/api/v1/library/getall?search=austen').set(as(admin));

    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].bookname).toBe('Emma');
  });
});

describe('B7: assignments relied on req.teacherId, which was never set', () => {
  it('returns the teacher\'s own assignments rather than an empty list', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school, { teachers: [teacher._id] });

    const created = await request(app)
      .post('/api/v1/assignments')
      .set(as(teacher))
      .send({
        title: 'Essay',
        description: 'Write 500 words',
        classId: klass._id,
        deadline: '2099-01-01',
      });

    expect(created.status).toBe(201);
    expect(created.body.assignment.teacher).toBe(teacher._id.toString());

    const listed = await request(app).get('/api/v1/assignments/getall').set(as(teacher));

    expect(listed.status).toBe(200);
    expect(listed.body.assignments).toHaveLength(1);
    expect(listed.body.assignments[0].title).toBe('Essay');
  });

  it('refuses to create an assignment for a class the teacher does not teach', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school);

    const res = await request(app)
      .post('/api/v1/assignments')
      .set(as(teacher))
      .send({ title: 'X', description: 'Y', classId: klass._id, deadline: '2099-01-01' });

    expect(res.status).toBe(403);
  });
});

describe('B8: literal route shadowed by /:classId', () => {
  it('serves /api/v1/class/getall without a CastError', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);

    const res = await request(app).get('/api/v1/class/getall').set(as(admin));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.classes)).toBe(true);
  });

  it('serves /api/v1/students/me without treating "me" as an id', async () => {
    const school = await makeSchool();
    const student = await makeStudent(school);

    const res = await request(app).get('/api/v1/students/me').set(as(student));

    expect(res.status).toBe(200);
    expect(res.body.student._id).toBe(student._id.toString());
  });

  it('serves /api/v1/teachers/me without treating "me" as an id', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);

    const res = await request(app).get('/api/v1/teachers/me').set(as(teacher));

    expect(res.status).toBe(200);
    expect(res.body.teacher._id).toBe(teacher._id.toString());
  });
});

describe('B9/B10: enrolment set only one side of the relationship', () => {
  it('sets student.class as well as class.students', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const student = await makeStudent(school, { registrationNumber: '2201' });
    const klass = await makeClass(school);

    const res = await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(admin))
      .send({ registrationNumber: '2201' });

    expect(res.status).toBe(200);

    const reloadedStudent = await Student.findById(student._id);
    const reloadedClass = await Class.findById(klass._id);

    expect(reloadedStudent.class.toString()).toBe(klass._id.toString());
    expect(reloadedClass.students.map(String)).toContain(student._id.toString());
  });

  it('clears student.class when the student is removed from the class', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const student = await makeStudent(school, { registrationNumber: '2201' });
    const klass = await makeClass(school);

    await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(admin))
      .send({ registrationNumber: '2201' });

    await request(app)
      .delete(`/api/v1/class/${klass._id}/students/${student._id}`)
      .set(as(admin));

    const reloaded = await Student.findById(student._id);
    expect(reloaded.class).toBeNull();
  });

  it('rejects enrolling the same student twice with 409', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    await makeStudent(school, { registrationNumber: '2201' });
    const klass = await makeClass(school);

    await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(admin))
      .send({ registrationNumber: '2201' });

    const res = await request(app)
      .post(`/api/v1/class/${klass._id}/students`)
      .set(as(admin))
      .send({ registrationNumber: '2201' });

    expect(res.status).toBe(409);
  });
});

describe('B11: teacher.classes was never maintained', () => {
  it('adds the class to teacher.classes when assigned', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school);

    await request(app)
      .post(`/api/v1/class/${klass._id}/teachers`)
      .set(as(admin))
      .send({ email: teacher.email });

    const reloaded = await Teacher.findById(teacher._id);
    expect(reloaded.classes.map(String)).toContain(klass._id.toString());
  });

  it('removes the class from teacher.classes when unassigned', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school);

    await request(app)
      .post(`/api/v1/class/${klass._id}/teachers`)
      .set(as(admin))
      .send({ email: teacher.email });

    await request(app)
      .delete(`/api/v1/class/${klass._id}/teachers/${teacher._id}`)
      .set(as(admin));

    const reloaded = await Teacher.findById(teacher._id);
    expect(reloaded.classes.map(String)).not.toContain(klass._id.toString());
  });
});

describe('B14: attendance dates were not normalised, duplicating documents', () => {
  it('updates the same document when marked twice on the same day', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, {
      teachers: [teacher._id],
      students: [student._id],
    });

    const first = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(teacher))
      .send({ date: '2026-09-16T09:00:00.000Z', attendance: { [student._id]: true } });

    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(teacher))
      .send({ date: '2026-09-16T15:30:00.000Z', attendance: { [student._id]: false } });

    expect(second.status).toBe(200);

    await expect(Attendance.countDocuments({ class: klass._id })).resolves.toBe(1);

    const stored = await Attendance.findOne({ class: klass._id });
    expect(stored.attendanceRecords[0].present).toBe(false);
  });

  it('rejects attendance for a student who is not in the class', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const outsider = await makeStudent(school);
    const klass = await makeClass(school, { teachers: [teacher._id] });

    const res = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(teacher))
      .send({ date: '2026-09-16', attendance: { [outsider._id]: true } });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid date with 400', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, {
      teachers: [teacher._id],
      students: [student._id],
    });

    const res = await request(app)
      .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
      .set(as(teacher))
      .send({ date: 'not-a-date', attendance: { [student._id]: true } });

    expect(res.status).toBe(400);
  });

  it('reports a student\'s own attendance percentage', async () => {
    const school = await makeSchool();
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, {
      teachers: [teacher._id],
      students: [student._id],
    });

    for (const [date, present] of [
      ['2026-09-14', true],
      ['2026-09-15', true],
      ['2026-09-16', false],
    ]) {
      await request(app)
        .post(`/api/v1/teachers/me/classes/${klass._id}/attendance`)
        .set(as(teacher))
        .send({ date, attendance: { [student._id]: present } });
    }

    const res = await request(app).get('/api/v1/students/me/attendance').set(as(student));

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({ total: 3, present: 2, absent: 1 });
    expect(res.body.summary.percentage).toBeCloseTo(66.7, 1);
  });
});

describe('B15: updateStudent existed but was never routed', () => {
  it('updates a student and re-hashes a supplied password', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const student = await makeStudent(school, { registrationNumber: '2201' });

    const res = await request(app)
      .put(`/api/v1/students/${student._id}`)
      .set(as(admin))
      .send({ name: 'Asha Kumar', password: 'newpassword1' });

    expect(res.status).toBe(200);
    expect(res.body.student.name).toBe('Asha Kumar');

    const reloaded = await Student.findById(student._id).select('+password');
    expect(reloaded.password).not.toBe('newpassword1');
    await expect(reloaded.matchPassword('newpassword1')).resolves.toBe(true);
  });

  it('leaves the password untouched when it is not supplied', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const student = await makeStudent(school);

    const before = (await Student.findById(student._id).select('+password')).password;

    await request(app)
      .put(`/api/v1/students/${student._id}`)
      .set(as(admin))
      .send({ name: 'Renamed' });

    const after = (await Student.findById(student._id).select('+password')).password;
    expect(after).toBe(before);
  });
});

describe('cascade deletes', () => {
  it('cleans up dependent records when a class is deleted', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const teacher = await makeTeacher(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, {
      teachers: [teacher._id],
      students: [student._id],
    });
    await Student.updateOne({ _id: student._id }, { $set: { class: klass._id } });
    await Teacher.updateOne({ _id: teacher._id }, { $addToSet: { classes: klass._id } });

    await Assignment.create({
      title: 'A',
      description: 'B',
      class: klass._id,
      teacher: teacher._id,
      school: school._id,
      deadline: new Date('2099-01-01'),
    });
    await Notice.create({
      title: 'N',
      content: 'C',
      class: klass._id,
      school: school._id,
    });
    await Attendance.create({
      class: klass._id,
      school: school._id,
      date: new Date('2026-09-16'),
      attendanceRecords: [{ student: student._id, present: true }],
    });

    const res = await request(app).delete(`/api/v1/class/${klass._id}`).set(as(admin));
    expect(res.status).toBe(200);

    await expect(Assignment.countDocuments({ class: klass._id })).resolves.toBe(0);
    await expect(Notice.countDocuments({ class: klass._id })).resolves.toBe(0);
    await expect(Attendance.countDocuments({ class: klass._id })).resolves.toBe(0);
    await expect(Class.countDocuments({ _id: klass._id })).resolves.toBe(0);

    expect((await Student.findById(student._id)).class).toBeNull();
    expect((await Teacher.findById(teacher._id)).classes.map(String)).not.toContain(
      klass._id.toString()
    );
  });

  it('removes a deleted student from their class roster', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const student = await makeStudent(school);
    const klass = await makeClass(school, { students: [student._id] });

    await request(app).delete(`/api/v1/students/${student._id}`).set(as(admin));

    const reloaded = await Class.findById(klass._id);
    expect(reloaded.students.map(String)).not.toContain(student._id.toString());
  });

  it('removes a deleted teacher from classes and subject assignments', async () => {
    const school = await makeSchool();
    const admin = await makeAdmin(school);
    const teacher = await makeTeacher(school);
    const klass = await makeClass(school, {
      teachers: [teacher._id],
      subjects: [{ name: 'Maths', teacher: teacher._id }],
    });

    await request(app).delete(`/api/v1/teachers/${teacher._id}`).set(as(admin));

    const reloaded = await Class.findById(klass._id);
    expect(reloaded.teachers.map(String)).not.toContain(teacher._id.toString());
    expect(reloaded.subjects).toHaveLength(0);
  });
});
