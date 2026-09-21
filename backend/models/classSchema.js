import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
      },
    ],
    subjects: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

classSchema.index({ school: 1, class: 1 }, { unique: true });

export const Class = mongoose.model('Class', classSchema);
