import express from 'express';
import {
  createAnnouncement,
  getAllAnnouncements,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/getall', getAllAnnouncements);
router.post('/', authorize('admin'), createAnnouncement);
router.delete('/:id', authorize('admin'), deleteAnnouncement);

export default router;
