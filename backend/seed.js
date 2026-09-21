/**
 * Development seed. Wipes the configured database and inserts one school with
 * an admin, teachers, students, classes, attendance, assignments and notices,
 * so the UI can be exercised immediately after a clean install.
 *
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import { loadEnv } from './config/env.js';
import { School } from './models/schoolSchema.js';
import { Admin } from './models/adminRegisterSchema.js';
import { Teacher } from './models/teacherSchema.js';
import { Student } from './models/studentSchema.js';
import { Class } from './models/classSchema.js';
import { Assignment } from './models/assignmentSchema.js';
import { Attendance } from './models/attendanceSchema.js';
import { Notice } from './models/noticeSchema.js';
import { Announcement } from './models/announcemntSchema.js';
import { Event } from './models/eventsSchema.js';
import { Book } from './models/librarySchema.js';
import { Submission } from './models/submissionSchema.js';
import { enrolStudent, assignTeacher } from './utils/cascade.js';
import { toUtcMidnight } from './utils/dates.js';

const PASSWORD = 'password1';

const run = async () => {
  const env = loadEnv();
  await mongoose.connect(env.MONGO_URL);
  console.log(`Connected to ${env.MONGO_URL}`);

  await Promise.all(
    [
      School,
      Admin,
      Teacher,
      Student,
      Class,
      Assignment,
      Attendance,
      Notice,
      Announcement,
      Event,
      Book,
      Submission,
    ].map((Model) => Model.deleteMany({}))
  );
  console.log('Cleared existing data');

  const school = await School.create({ name: 'Springfield High', code: 'SPRING' });

  const admin = await Admin.create({
    name: 'Ratan Gulati',
    email: 'admin@classroom.test',
    password: PASSWORD,
    school: school._id,
  });

  school.createdBy = admin._id;
  await school.save();

  const teacherSeeds = [
    { name: 'Meera Iyer', email: 'meera@classroom.test', subject: 'Mathematics' },
    { name: 'Arjun Rao', email: 'arjun@classroom.test', subject: 'Physics' },
    { name: 'Sara Khan', email: 'sara@classroom.test', subject: 'English' },
  ];

  const teachers = [];
  for (const seed of teacherSeeds) {
    teachers.push(await Teacher.create({ ...seed, password: PASSWORD, school: school._id }));
  }

  const classes = [];
  for (const name of ['Grade 9-A', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A']) {
    classes.push(await Class.create({ class: name, school: school._id }));
  }

  // Each teacher takes the class at their index, and the first teacher covers
  // the spare class so one teacher has more than one.
  await assignTeacher(classes[0], teachers[0]);
  await assignTeacher(classes[1], teachers[0]);
  await assignTeacher(classes[1], teachers[1]);
  await assignTeacher(classes[2], teachers[1]);
  await assignTeacher(classes[3], teachers[2]);

  await Class.updateOne(
    { _id: classes[1]._id },
    {
      $set: {
        subjects: [
          { name: 'Mathematics', teacher: teachers[0]._id },
          { name: 'Physics', teacher: teachers[1]._id },
        ],
      },
    }
  );

  const firstNames = [
    'Asha', 'Dev', 'Priya', 'Rohan', 'Nisha', 'Kabir', 'Tara', 'Vikram',
    'Anita', 'Sameer', 'Leela', 'Aryan', 'Divya', 'Nikhil', 'Maya',
    'Ishaan', 'Riya', 'Karan', 'Sneha', 'Aditya',
  ];

  const students = [];
  for (let i = 0; i < firstNames.length; i += 1) {
    const student = await Student.create({
      name: `${firstNames[i]} Sharma`,
      registrationNumber: `22${String(i + 1).padStart(3, '0')}`,
      password: PASSWORD,
      school: school._id,
    });
    students.push(student);
    await enrolStudent(classes[i % classes.length], student);
  }

  // Five school days of attendance for Grade 10-A, mostly present.
  const grade10a = await Class.findById(classes[1]._id);
  for (let dayOffset = 4; dayOffset >= 0; dayOffset -= 1) {
    const date = toUtcMidnight(new Date(Date.now() - dayOffset * 86400000));
    await Attendance.create({
      class: grade10a._id,
      school: school._id,
      date,
      attendanceRecords: grade10a.students.map((studentId, index) => ({
        student: studentId,
        present: !(index === 0 && dayOffset === 2),
      })),
    });
  }

  const inDays = (days) => new Date(Date.now() + days * 86400000);

  await Assignment.create([
    {
      title: 'Quadratic equations worksheet',
      description: 'Complete questions 1 to 20 from chapter 4.',
      class: classes[1]._id,
      teacher: teachers[0]._id,
      school: school._id,
      deadline: inDays(7),
    },
    {
      title: 'Newton\'s laws lab report',
      description: 'Write up the trolley experiment, 800 words with a diagram.',
      class: classes[1]._id,
      teacher: teachers[1]._id,
      school: school._id,
      deadline: inDays(14),
    },
    {
      title: 'Book review',
      description: 'Review any novel you read this term, 500 words.',
      class: classes[3]._id,
      teacher: teachers[2]._id,
      school: school._id,
      deadline: inDays(3),
    },
  ]);

  await Notice.create([
    {
      title: 'Bring your calculators',
      content: 'From Monday, every maths lesson needs a scientific calculator.',
      class: classes[1]._id,
      school: school._id,
      createdBy: teachers[0]._id,
    },
    {
      title: 'Lab safety briefing',
      content: 'Physics practicals begin next week. Closed shoes are required.',
      class: classes[1]._id,
      school: school._id,
      createdBy: teachers[1]._id,
    },
  ]);

  await Announcement.create([
    {
      title: 'Parent-teacher meeting',
      announcement: 'The next parent-teacher meeting is on the last Friday of the month.',
      school: school._id,
      createdBy: admin._id,
    },
    {
      title: 'Library hours extended',
      announcement: 'The library is now open until 6pm on weekdays.',
      school: school._id,
      createdBy: admin._id,
    },
  ]);

  await Event.create([
    { title: 'Annual sports day', date: inDays(21), description: 'All-day athletics on the main field.', school: school._id },
    { title: 'Science exhibition', date: inDays(35), description: 'Student projects on display in the main hall.', school: school._id },
    { title: 'Mid-term break', date: inDays(45), description: 'School closed for one week.', school: school._id },
  ]);

  await Book.create([
    { bookname: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', copies: 4, available: 4, school: school._id },
    { bookname: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', copies: 2, available: 1, school: school._id },
    { bookname: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', copies: 3, available: 3, school: school._id },
    { bookname: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', copies: 2, available: 2, school: school._id },
  ]);

  console.log('\nSeed complete.\n');
  console.log(`  School code    ${school.code}`);
  console.log(`  Admin          admin@classroom.test / ${PASSWORD}`);
  console.log(`  Teacher        meera@classroom.test / ${PASSWORD}`);
  console.log(`  Student        22002 / ${PASSWORD}   (Grade 10-A)`);
  console.log('\nTeachers and students also need the school code above to sign in.\n');

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
