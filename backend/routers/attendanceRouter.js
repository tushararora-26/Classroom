import express from 'express';
import { getMyAttendance } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// Marking and reading class attendance lives under the teacher router, where
// the class is in the path and ownership can be proved. This router only
// exposes a student's own record.
router.get('/me', authorize('student'), getMyAttendance);

export default router;
