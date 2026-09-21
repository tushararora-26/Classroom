import express from 'express';
import { gradeSubmission } from '../controllers/submissionController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.patch('/:id/grade', authorize('admin', 'teacher'), gradeSubmission);

export default router;
