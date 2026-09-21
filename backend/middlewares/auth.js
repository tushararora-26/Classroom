import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Admin } from '../models/adminRegisterSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import { Student } from '../models/studentSchema.js';
import { Class } from '../models/classSchema.js';

const MODELS = {
  admin: Admin,
  teacher: Teacher,
  student: Student,
};

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated');
  }

  const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  const Model = MODELS[decoded.role];

  if (!Model) {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await Model.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'Account no longer exists');
  }

  // The token carries the school, but the stored document is authoritative:
  // a token minted before a record moved must not keep the old scope.
  if (user.school.toString() !== decoded.school) {
    throw new ApiError(401, 'Session is no longer valid');
  }

  user.role = decoded.role;
  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to this resource'));
    }
    next();
  };

export const requireClassAccess = asyncHandler(async (req, res, next) => {
  const { classId } = req.params;

  const classDoc = await Class.findOne({ _id: classId, school: req.user.school });

  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }

  if (req.user.role === 'teacher') {
    const teaches = classDoc.teachers.some((id) => id.equals(req.user._id));
    if (!teaches) {
      throw new ApiError(403, 'You do not teach this class');
    }
  }

  if (req.user.role === 'student') {
    const enrolled = classDoc.students.some((id) => id.equals(req.user._id));
    if (!enrolled) {
      throw new ApiError(403, 'You are not enrolled in this class');
    }
  }

  req.classDoc = classDoc;
  next();
});
