import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerAdmin,
  signInAdmin,
  signUpTeacher,
  signInTeacher,
  signUpStudent,
  signInStudent,
  getAdminProfile,
  updateAdminProfile,
  updateSchool,
  getMe,
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Credential endpoints are the one place brute force is cheap, so they get
// their own limiter rather than relying on a global one.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/admin/register', authLimiter, registerAdmin);
router.post('/admin/signin', authLimiter, signInAdmin);

router.post('/teachers/signup', authLimiter, signUpTeacher);
router.post('/teachers/signin', authLimiter, signInTeacher);

router.post('/students/signup', authLimiter, signUpStudent);
router.post('/students/signin', authLimiter, signInStudent);

// Admin self-service. These sit above the resource routers, so '/admin/me'
// is never parsed as an id by anything downstream.
router.get('/admin/me', protect, authorize('admin'), getAdminProfile);
router.put('/admin/me', protect, authorize('admin'), updateAdminProfile);
router.put('/admin/school', protect, authorize('admin'), updateSchool);

router.get('/me', protect, getMe);

export default router;
