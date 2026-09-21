import express from 'express';
import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/libraryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/getall', getAllBooks);
router.post('/', authorize('admin'), createBook);
router.put('/:id', authorize('admin'), updateBook);
router.delete('/:id', authorize('admin'), deleteBook);

export default router;
