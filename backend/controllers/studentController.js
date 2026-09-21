import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Student } from '../models/studentSchema.js';
import { Class } from '../models/classSchema.js';
import { removeStudentEverywhere } from '../utils/cascade.js';

export const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ school: req.user.school })
    .populate('class', 'class')
    .sort({ name: 1 });

  res.status(200).json({ success: true, students });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { name, registrationNumber, password } = req.body;

  if (!name || !registrationNumber || !password) {
    throw new ApiError(400, 'Name, registration number and password are all required');
  }

  const student = await Student.create({
    name,
    registrationNumber,
    password,
    school: req.user.school,
  });

  res.status(201).json({
    success: true,
    message: 'Student created',
    student: {
      _id: student._id,
      name: student.name,
      registrationNumber: student.registrationNumber,
      class: student.class,
    },
  });
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.id,
    school: req.user.school,
  }).populate('class', 'class');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  res.status(200).json({ success: true, student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { name, registrationNumber, password } = req.body;

  const student = await Student.findOne({
    _id: req.params.id,
    school: req.user.school,
  }).select('+password');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  if (name !== undefined) student.name = name;
  if (registrationNumber !== undefined) student.registrationNumber = registrationNumber;
  // Only re-hash when a new password was actually supplied.
  if (password) student.password = password;

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student updated',
    student: {
      _id: student._id,
      name: student.name,
      registrationNumber: student.registrationNumber,
      class: student.class,
    },
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, school: req.user.school });

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  await removeStudentEverywhere(student._id);
  await Student.findByIdAndDelete(student._id);

  res.status(200).json({ success: true, message: 'Student deleted' });
});

/* ---------- self-service (`/me`) ---------- */

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).populate('class', 'class');

  res.status(200).json({ success: true, student });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, password, currentPassword } = req.body;

  const student = await Student.findById(req.user._id).select('+password');

  // Re-entering the current password is what stops an unlocked session or a
  // leaked token from quietly changing the credentials on the account.
  if (password) {
    if (!currentPassword) {
      throw new ApiError(400, 'Enter your current password to set a new one');
    }

    if (!(await student.matchPassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  if (name !== undefined) student.name = name;
  if (password) student.password = password;

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    student: { _id: student._id, name: student.name, registrationNumber: student.registrationNumber },
  });
});

export const getMyClass = asyncHandler(async (req, res) => {
  if (!req.user.class) {
    throw new ApiError(404, 'You are not assigned to any class');
  }

  const classDoc = await Class.findOne({
    _id: req.user.class,
    school: req.user.school,
  })
    .populate('teachers', 'name email subject')
    .populate('subjects.teacher', 'name email');

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  res.status(200).json({ success: true, class: classDoc });
});
