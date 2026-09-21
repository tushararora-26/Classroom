import express from 'express';
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassTeachers,
  addStudentToClass,
  removeStudentFromClass,
  addTeacherToClass,
  removeTeacherFromClass,
  addSubject,
  deleteSubject,
} from '../controllers/classController.js';
import { protect, authorize, requireClassAccess } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// Literal paths must precede '/:classId', otherwise Express treats the literal
// segment as an id and Mongoose raises a CastError (the original B8 defect).
router.get('/getall', authorize('admin', 'teacher'), getAllClasses);

router.post('/', authorize('admin'), createClass);

router.get('/:classId', requireClassAccess, getClassById);
router.put('/:classId', authorize('admin'), updateClass);
router.delete('/:classId', authorize('admin'), deleteClass);

router.get('/:classId/teachers', requireClassAccess, getClassTeachers);

router.post('/:classId/students', authorize('admin'), addStudentToClass);
router.delete('/:classId/students/:studentId', authorize('admin'), removeStudentFromClass);

router.post('/:classId/teachers', authorize('admin'), addTeacherToClass);
router.delete('/:classId/teachers/:teacherId', authorize('admin'), removeTeacherFromClass);

router.post('/:classId/subjects', authorize('admin'), addSubject);
router.delete('/:classId/subjects/:subjectId', authorize('admin'), deleteSubject);

export default router;
