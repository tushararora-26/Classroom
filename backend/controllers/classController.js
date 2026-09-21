import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Class } from '../models/classSchema.js';
import { Student } from '../models/studentSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import {
  enrolStudent,
  unenrolStudent,
  assignTeacher,
  unassignTeacher,
  removeClassEverywhere,
} from '../utils/cascade.js';

const POPULATE = [
  { path: 'students', select: 'name registrationNumber' },
  { path: 'teachers', select: 'name email subject' },
  { path: 'subjects.teacher', select: 'name email' },
];

const loadClass = async (classId, school) => {
  const classDoc = await Class.findOne({ _id: classId, school }).populate(POPULATE);

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  return classDoc;
};

export const createClass = asyncHandler(async (req, res) => {
  const { class: className } = req.body;

  if (!className) {
    throw new ApiError(400, 'Class name is required');
  }

  const newClass = await Class.create({ class: className, school: req.user.school });

  res.status(201).json({ success: true, message: 'Class created', newClass });
});

export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ school: req.user.school })
    .populate(POPULATE)
    .sort({ class: 1 });

  res.status(200).json({ success: true, classes });
});

export const getClassById = asyncHandler(async (req, res) => {
  const classDetails = await loadClass(req.params.classId, req.user.school);

  res.status(200).json({ success: true, class: classDetails });
});

export const updateClass = asyncHandler(async (req, res) => {
  const { class: className } = req.body;

  if (!className) {
    throw new ApiError(400, 'Class name is required');
  }

  const updated = await Class.findOneAndUpdate(
    { _id: req.params.classId, school: req.user.school },
    { $set: { class: className } },
    { new: true, runValidators: true }
  ).populate(POPULATE);

  if (!updated) {
    throw new ApiError(404, 'Class not found');
  }

  res.status(200).json({ success: true, message: 'Class updated', class: updated });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  await removeClassEverywhere(classId);
  await Class.findByIdAndDelete(classId);

  res.status(200).json({ success: true, message: 'Class deleted' });
});

export const getClassTeachers = asyncHandler(async (req, res) => {
  const classDoc = await Class.findOne({
    _id: req.params.classId,
    school: req.user.school,
  }).populate('teachers', 'name email subject');

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  res.status(200).json({ success: true, teachers: classDoc.teachers });
});

export const addStudentToClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { registrationNumber } = req.body;

  if (!registrationNumber) {
    throw new ApiError(400, 'Registration number is required');
  }

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  const student = await Student.findOne({
    registrationNumber: registrationNumber.trim(),
    school: req.user.school,
  });

  if (!student) {
    throw new ApiError(404, 'No student in this school has that registration number');
  }

  if (classDoc.students.some((id) => id.equals(student._id))) {
    throw new ApiError(409, 'Student is already enrolled in this class');
  }

  await enrolStudent(classDoc, student);

  res.status(200).json({
    success: true,
    message: 'Student added to class',
    class: await loadClass(classId, req.user.school),
  });
});

export const removeStudentFromClass = asyncHandler(async (req, res) => {
  const { classId, studentId } = req.params;

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  await unenrolStudent(classId, studentId);

  res.status(200).json({
    success: true,
    message: 'Student removed from class',
    class: await loadClass(classId, req.user.school),
  });
});

export const addTeacherToClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { email, teacherId } = req.body;

  if (!email && !teacherId) {
    throw new ApiError(400, 'A teacher email or id is required');
  }

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  const teacher = await Teacher.findOne({
    school: req.user.school,
    ...(teacherId ? { _id: teacherId } : { email: email.toLowerCase().trim() }),
  });

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found in this school');
  }

  if (classDoc.teachers.some((id) => id.equals(teacher._id))) {
    throw new ApiError(409, 'Teacher is already assigned to this class');
  }

  await assignTeacher(classDoc, teacher);

  res.status(200).json({
    success: true,
    message: 'Teacher added to class',
    class: await loadClass(classId, req.user.school),
  });
});

export const removeTeacherFromClass = asyncHandler(async (req, res) => {
  const { classId, teacherId } = req.params;

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  await unassignTeacher(classId, teacherId);

  res.status(200).json({
    success: true,
    message: 'Teacher removed from class',
    class: await loadClass(classId, req.user.school),
  });
});

export const addSubject = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { name, teacherId } = req.body;

  if (!name || !teacherId) {
    throw new ApiError(400, 'Subject name and teacher are required');
  }

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  const teacher = await Teacher.findOne({ _id: teacherId, school: req.user.school });

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found in this school');
  }

  classDoc.subjects.push({ name, teacher: teacher._id });
  await classDoc.save();

  res.status(200).json({
    success: true,
    message: 'Subject added',
    class: await loadClass(classId, req.user.school),
  });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { classId, subjectId } = req.params;

  const updated = await Class.findOneAndUpdate(
    { _id: classId, school: req.user.school },
    { $pull: { subjects: { _id: subjectId } } },
    { new: true }
  ).populate(POPULATE);

  if (!updated) {
    throw new ApiError(404, 'Class not found');
  }

  res.status(200).json({ success: true, message: 'Subject removed', class: updated });
});
