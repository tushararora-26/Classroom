import express from 'express';
import {
  createAssignment,
  getMyTeachingAssignments,
  getMyAssignments,
  getAssignmentsByClassId,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import {
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} from '../controllers/submissionController.js';
import { protect, authorize, requireClassAccess } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', authorize('student'), getMyAssignments);
router.get('/getall', authorize('teacher'), getMyTeachingAssignments);

router.post('/', authorize('teacher'), createAssignment);

router.get('/class/:classId', requireClassAccess, getAssignmentsByClassId);

router.post('/:id/submissions', authorize('student'), submitAssignment);
router.get('/:id/submissions', authorize('admin', 'teacher'), getAssignmentSubmissions);

router.delete('/:id', authorize('admin', 'teacher'), deleteAssignment);

export default router;
