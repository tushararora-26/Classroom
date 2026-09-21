import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    attendanceRecords: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        present: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Dates are normalised to UTC midnight before writing, so one document per
// class per day. Without this index, a concurrent double-submit duplicates.
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
