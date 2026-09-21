import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { generateUniqueSchoolCode } from '../utils/schoolCode.js';
import { School } from '../models/schoolSchema.js';
import { Admin } from '../models/adminRegisterSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import { Student } from '../models/studentSchema.js';

const shapeSchool = (school) => ({
  _id: school._id,
  name: school.name,
  code: school.code,
});

const shapeUser = (user, role) => {
  const base = { _id: user._id, name: user.name, role };

  if (role === 'admin') return { ...base, email: user.email };
  if (role === 'teacher') {
    return { ...base, email: user.email, subject: user.subject };
  }
  return { ...base, registrationNumber: user.registrationNumber, class: user.class };
};

const respondWithSession = (res, status, user, role, school) =>
  res.status(status).json({
    success: true,
    token: generateToken(user._id, role, school._id),
    user: shapeUser(user, role),
    school: shapeSchool(school),
  });

const findSchoolByCode = async (schoolCode) => {
  if (!schoolCode) {
    throw new ApiError(400, 'School code is required');
  }

  const school = await School.findOne({ code: schoolCode.trim().toUpperCase() });

  if (!school) {
    throw new ApiError(404, 'No school found with that code');
  }

  return school;
};

/**
 * Registering an admin creates the school they will administer and returns its
 * generated code, which teachers and students then use to join.
 */
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, schoolName } = req.body;

  if (!name || !email || !password || !schoolName) {
    throw new ApiError(400, 'Name, email, password and school name are all required');
  }

  if (await Admin.exists({ email: email.toLowerCase().trim() })) {
    throw new ApiError(409, 'An admin with that email already exists');
  }

  const school = await School.create({
    name: schoolName,
    code: await generateUniqueSchoolCode(),
  });

  let admin;
  try {
    admin = await Admin.create({ name, email, password, school: school._id });
  } catch (err) {
    // Do not leave an orphaned school behind if the admin fails validation.
    await School.findByIdAndDelete(school._id);
    throw err;
  }

  school.createdBy = admin._id;
  await school.save();

  return respondWithSession(res, 201, admin, 'admin', school);
});

export const signInAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!admin || !(await admin.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const school = await School.findById(admin.school);

  return respondWithSession(res, 200, admin, 'admin', school);
});

export const signUpTeacher = asyncHandler(async (req, res) => {
  const { name, email, subject, password, schoolCode } = req.body;

  if (!name || !email || !subject || !password) {
    throw new ApiError(400, 'Name, email, subject and password are all required');
  }

  const school = await findSchoolByCode(schoolCode);

  const teacher = await Teacher.create({
    name,
    email,
    subject,
    password,
    school: school._id,
  });

  return respondWithSession(res, 201, teacher, 'teacher', school);
});

export const signInTeacher = asyncHandler(async (req, res) => {
  const { email, password, schoolCode } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const school = await findSchoolByCode(schoolCode);

  const teacher = await Teacher.findOne({
    email: email.toLowerCase().trim(),
    school: school._id,
  }).select('+password');

  if (!teacher || !(await teacher.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return respondWithSession(res, 200, teacher, 'teacher', school);
});

export const signUpStudent = asyncHandler(async (req, res) => {
  const { name, registrationNumber, password, schoolCode } = req.body;

  if (!name || !registrationNumber || !password) {
    throw new ApiError(400, 'Name, registration number and password are all required');
  }

  const school = await findSchoolByCode(schoolCode);

  const student = await Student.create({
    name,
    registrationNumber,
    password,
    school: school._id,
  });

  return respondWithSession(res, 201, student, 'student', school);
});

export const signInStudent = asyncHandler(async (req, res) => {
  const { registrationNumber, password, schoolCode } = req.body;

  if (!registrationNumber || !password) {
    throw new ApiError(400, 'Registration number and password are required');
  }

  const school = await findSchoolByCode(schoolCode);

  const student = await Student.findOne({
    registrationNumber: registrationNumber.trim(),
    school: school._id,
  }).select('+password');

  if (!student || !(await student.matchPassword(password))) {
    throw new ApiError(401, 'Invalid registration number or password');
  }

  return respondWithSession(res, 200, student, 'student', school);
});

/* ---------- admin self-service ---------- */

export const getAdminProfile = asyncHandler(async (req, res) => {
  const school = await School.findById(req.user.school);

  res.status(200).json({
    success: true,
    admin: shapeUser(req.user, 'admin'),
    school: shapeSchool(school),
  });
});

/**
 * Email is the admin's login and the password guards the account, so changing
 * either requires re-entering the current password. Without that, an unlocked
 * session or a leaked token would be enough to take the account over silently.
 */
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, password, currentPassword } = req.body;

  const admin = await Admin.findById(req.user._id).select('+password');

  const wantsEmailChange =
    email !== undefined && email.toLowerCase().trim() !== admin.email;
  const wantsPasswordChange = Boolean(password);

  if (wantsEmailChange || wantsPasswordChange) {
    if (!currentPassword) {
      throw new ApiError(400, 'Enter your current password to change your email or password');
    }

    if (!(await admin.matchPassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  if (wantsEmailChange) {
    const taken = await Admin.exists({
      email: email.toLowerCase().trim(),
      _id: { $ne: admin._id },
    });

    if (taken) {
      throw new ApiError(409, 'An admin with that email already exists');
    }

    admin.email = email;
  }

  if (name !== undefined) admin.name = name;
  if (wantsPasswordChange) admin.password = password;

  await admin.save();

  const school = await School.findById(admin.school);

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    admin: shapeUser(admin, 'admin'),
    school: shapeSchool(school),
  });
});

/** The join code is deliberately not changeable: people have it written down. */
export const updateSchool = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'School name is required');
  }

  const school = await School.findByIdAndUpdate(
    req.user.school,
    { $set: { name: name.trim() } },
    { new: true, runValidators: true }
  );

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  res.status(200).json({
    success: true,
    message: 'School updated',
    school: shapeSchool(school),
  });
});

/** Lets a client rehydrate a session from a stored token. */
export const getMe = asyncHandler(async (req, res) => {
  const school = await School.findById(req.user.school);

  res.status(200).json({
    success: true,
    user: shapeUser(req.user, req.user.role),
    school: shapeSchool(school),
  });
});
