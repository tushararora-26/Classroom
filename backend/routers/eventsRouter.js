import express from 'express';
import { createEvent, getAllEvents, deleteEvent } from '../controllers/eventsController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/getall', getAllEvents);
router.post('/', authorize('admin'), createEvent);
router.delete('/:id', authorize('admin'), deleteEvent);

export default router;
