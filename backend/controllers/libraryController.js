import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Book } from '../models/librarySchema.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAllBooks = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;

  const filter = { school: req.user.school };

  if (search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ bookname: pattern }, { author: pattern }, { isbn: pattern }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

  const [books, total] = await Promise.all([
    Book.find(filter)
      .sort({ bookname: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    books,
    pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
  });
});

export const createBook = asyncHandler(async (req, res) => {
  const { bookname, author, isbn, copies } = req.body;

  if (!bookname || !author) {
    throw new ApiError(400, 'Book name and author are required');
  }

  const count = copies === undefined ? 1 : Number(copies);

  if (Number.isNaN(count) || count < 0) {
    throw new ApiError(400, 'Copies must be a non-negative number');
  }

  const book = await Book.create({
    bookname,
    author,
    isbn: isbn || '',
    copies: count,
    available: count,
    school: req.user.school,
  });

  res.status(201).json({ success: true, message: 'Book added', book });
});

export const updateBook = asyncHandler(async (req, res) => {
  const { bookname, author, isbn, copies, available } = req.body;

  const book = await Book.findOne({ _id: req.params.id, school: req.user.school });

  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  if (bookname !== undefined) book.bookname = bookname;
  if (author !== undefined) book.author = author;
  if (isbn !== undefined) book.isbn = isbn;
  if (copies !== undefined) book.copies = Number(copies);
  if (available !== undefined) book.available = Number(available);

  if (book.available > book.copies) {
    throw new ApiError(400, 'Available cannot exceed total copies');
  }

  await book.save();

  res.status(200).json({ success: true, message: 'Book updated', book });
});

export const deleteBook = asyncHandler(async (req, res) => {
  const deleted = await Book.findOneAndDelete({
    _id: req.params.id,
    school: req.user.school,
  });

  if (!deleted) {
    throw new ApiError(404, 'Book not found');
  }

  res.status(200).json({ success: true, message: 'Book deleted' });
});
