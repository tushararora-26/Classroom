import mongoose from 'mongoose';

const librarySchema = new mongoose.Schema(
  {
    bookname: {
      type: String,
      required: [true, 'Book name is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    copies: {
      type: Number,
      default: 1,
      min: [0, 'Copies cannot be negative'],
    },
    available: {
      type: Number,
      default: 1,
      min: [0, 'Available cannot be negative'],
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

librarySchema.index({ school: 1, bookname: 1, author: 1 });

export const Book = mongoose.model('Library', librarySchema);
