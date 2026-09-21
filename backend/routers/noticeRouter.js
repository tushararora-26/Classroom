import express from 'express';
import {
  createNotice,
  getAllNotices,
  getMyTeachingNotices,
  getNoticesByClassId,
  getMyNotices,
  deleteNotice,
} from '../controllers/noticeController.js';
import { protect, authorize, requireClassAccess } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', authorize('student'), getMyNotices);
router.get('/getall', authorize('admin', 'teacher'), (req, res, next) =>
  req.user.role === 'teacher'
    ? getMyTeachingNotices(req, res, next)
    : getAllNotices(req, res, next)
);

router.get('/class/:classId', requireClassAccess, getNoticesByClassId);
router.post('/:classId', authorize('admin', 'teacher'), requireClassAccess, createNotice);

router.delete('/:id', authorize('admin', 'teacher'), deleteNotice);

export default router;
