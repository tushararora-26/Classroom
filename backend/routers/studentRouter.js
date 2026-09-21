import express from 'express';
import {
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyProfile,
  updateMyProfile,
  getMyClass,
} from '../controllers/studentController.js';
import { getMyAssignments } from '../controllers/assignmentController.js';
import { getMyNotices } from '../controllers/noticeController.js';
import { getMyAttendance } from '../controllers/attendanceController.js';
import { getMySubmissions } from '../controllers/submissionController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

/* Self-service routes come first so 'me' is never parsed as an id. */
router.get('/me', authorize('student'), getMyProfile);
router.put('/me', authorize('student'), updateMyProfile);
router.get('/me/class', authorize('student'), getMyClass);
router.get('/me/assignments', authorize('student'), getMyAssignments);
router.get('/me/submissions', authorize('student'), getMySubmissions);
router.get('/me/notices', authorize('student'), getMyNotices);
router.get('/me/attendance', authorize('student'), getMyAttendance);

router.get('/getall', authorize('admin', 'teacher'), getAllStudents);
router.post('/', authorize('admin'), createStudent);

router.get('/:id', authorize('admin', 'teacher'), getStudentById);
router.put('/:id', authorize('admin'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);

export default router;
