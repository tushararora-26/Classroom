import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Teacher } from '../models/teacherSchema.js';
import { Class } from '../models/classSchema.js';
import { removeTeacherEverywhere } from '../utils/cascade.js';

export const getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({ school: req.user.school })
    .populate('classes', 'class')
    .sort({ name: 1 });

  res.status(200).json({ success: true, teachers });
});

export const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, subject, password } = req.body;

  if (!name || !email || !subject || !password) {
    throw new ApiError(400, 'Name, email, subject and password are all required');
  }

  const teacher = await Teacher.create({
    name,
    email,
    subject,
    password,
    school: req.user.school,
  });

  res.status(201).json({
    success: true,
    message: 'Teacher created',
    teacher: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      classes: teacher.classes,
    },
  });
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    _id: req.params.id,
    school: req.user.school,
  }).populate('classes', 'class');

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  res.status(200).json({ success: true, teacher });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const { name, email, subject, password } = req.body;

  const teacher = await Teacher.findOne({
    _id: req.params.id,
    school: req.user.school,
  }).select('+password');

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  if (name !== undefined) teacher.name = name;
  if (email !== undefined) teacher.email = email;
  if (subject !== undefined) teacher.subject = subject;
  if (password) teacher.password = password;

  await teacher.save();

  res.status(200).json({
    success: true,
    message: 'Teacher updated',
    teacher: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      classes: teacher.classes,
    },
  });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.user.school });

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  await removeTeacherEverywhere(teacher._id);
  await Teacher.findByIdAndDelete(teacher._id);

  res.status(200).json({ success: true, message: 'Teacher deleted' });
});

/* ---------- self-service (`/me`) ---------- */

export const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id).populate('classes', 'class');

  res.status(200).json({ success: true, teacher });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, password, currentPassword } = req.body;

  const teacher = await Teacher.findById(req.user._id).select('+password');

  // Re-entering the current password is what stops an unlocked session or a
  // leaked token from quietly changing the credentials on the account.
  if (password) {
    if (!currentPassword) {
      throw new ApiError(400, 'Enter your current password to set a new one');
    }

    if (!(await teacher.matchPassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  if (name !== undefined) teacher.name = name;
  if (password) teacher.password = password;

  await teacher.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    teacher: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
    },
  });
});

export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teachers: req.user._id, school: req.user.school })
    .populate('students', 'name registrationNumber')
    .populate('teachers', 'name email subject')
    .sort({ class: 1 });

  res.status(200).json({ success: true, classes });
});

export const getMyClassById = asyncHandler(async (req, res) => {
  // requireClassAccess has already proved this teacher owns the class.
  const classDoc = await Class.findById(req.classDoc._id)
    .populate('students', 'name registrationNumber')
    .populate('teachers', 'name email subject')
    .populate('subjects.teacher', 'name email');

  res.status(200).json({ success: true, class: classDoc });
});
