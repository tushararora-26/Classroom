import express from 'express';
import {
  getAllTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMyProfile,
  updateMyProfile,
  getMyClasses,
  getMyClassById,
} from '../controllers/teacherController.js';
import {
  markAttendance,
  getAttendanceForDate,
  getClassAttendance,
} from '../controllers/attendanceController.js';
import {
  getMyTeachingAssignments,
  getAssignmentsByClassId,
} from '../controllers/assignmentController.js';
import { protect, authorize, requireClassAccess } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

/* Self-service routes come first so 'me' is never parsed as an id. */
router.get('/me', authorize('teacher'), getMyProfile);
router.put('/me', authorize('teacher'), updateMyProfile);
router.get('/me/classes', authorize('teacher'), getMyClasses);
router.get('/me/assignments', authorize('teacher'), getMyTeachingAssignments);

router.get('/me/classes/:classId', authorize('teacher'), requireClassAccess, getMyClassById);
router.get(
  '/me/classes/:classId/assignments',
  authorize('teacher'),
  requireClassAccess,
  getAssignmentsByClassId
);

router.post(
  '/me/classes/:classId/attendance',
  authorize('teacher'),
  requireClassAccess,
  markAttendance
);
router.get(
  '/me/classes/:classId/attendance',
  authorize('teacher'),
  requireClassAccess,
  getAttendanceForDate
);
router.get(
  '/me/classes/:classId/all-attendance',
  authorize('teacher'),
  requireClassAccess,
  getClassAttendance
);

router.get('/getall', authorize('admin', 'teacher'), getAllTeachers);
router.post('/', authorize('admin'), createTeacher);

router.get('/:id', authorize('admin'), getTeacherById);
router.put('/:id', authorize('admin'), updateTeacher);
router.delete('/:id', authorize('admin'), deleteTeacher);

export default router;
