import { School } from '../../models/schoolSchema.js';
import { Admin } from '../../models/adminRegisterSchema.js';
import { Teacher } from '../../models/teacherSchema.js';
import { Student } from '../../models/studentSchema.js';
import { Class } from '../../models/classSchema.js';
import { generateToken } from '../../utils/generateToken.js';

let seq = 0;
const next = () => ++seq;

export const makeSchool = (overrides = {}) => {
  const n = next();
  return School.create({ name: `School ${n}`, code: `CODE${n}`, ...overrides });
};

export const makeAdmin = async (school, overrides = {}) => {
  const n = next();
  const admin = await Admin.create({
    name: `Admin ${n}`,
    email: `admin${n}@example.com`,
    password: 'password1',
    school: school._id,
    ...overrides,
  });
  admin.role = 'admin';
  return admin;
};

export const makeTeacher = async (school, overrides = {}) => {
  const n = next();
  const teacher = await Teacher.create({
    name: `Teacher ${n}`,
    email: `teacher${n}@example.com`,
    subject: 'Maths',
    password: 'password1',
    school: school._id,
    ...overrides,
  });
  teacher.role = 'teacher';
  return teacher;
};

export const makeStudent = async (school, overrides = {}) => {
  const n = next();
  const student = await Student.create({
    name: `Student ${n}`,
    registrationNumber: `REG${n}`,
    password: 'password1',
    school: school._id,
    ...overrides,
  });
  student.role = 'student';
  return student;
};

export const makeClass = (school, overrides = {}) => {
  const n = next();
  return Class.create({ class: `Grade ${n}`, school: school._id, ...overrides });
};

export const tokenFor = (user) =>
  generateToken(user._id, user.role, user.school);

export const authHeader = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });
