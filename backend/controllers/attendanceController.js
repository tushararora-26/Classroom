import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Attendance } from '../models/attendanceSchema.js';
import { toUtcMidnight } from '../utils/dates.js';

/**
 * Body shape: { date, attendance: { <studentId>: boolean, ... } }
 * Only students actually enrolled in the class are recorded, so a stale client
 * cannot write attendance for someone who has left.
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { date, attendance } = req.body;
  const classDoc = req.classDoc;

  if (!date) {
    throw new ApiError(400, 'A date is required');
  }

  if (!attendance || typeof attendance !== 'object' || Object.keys(attendance).length === 0) {
    throw new ApiError(400, 'Attendance data is missing or invalid');
  }

  const enrolled = new Set(classDoc.students.map((id) => id.toString()));
  const unknown = Object.keys(attendance).filter((id) => !enrolled.has(id));

  if (unknown.length > 0) {
    throw new ApiError(400, 'Attendance includes students who are not in this class');
  }

  const attendanceRecords = Object.entries(attendance).map(([student, present]) => ({
    student,
    present: Boolean(present),
  }));

  const day = toUtcMidnight(date);

  const attendanceDoc = await Attendance.findOneAndUpdate(
    { class: classDoc._id, date: day },
    {
      $set: { attendanceRecords },
      $setOnInsert: { class: classDoc._id, date: day, school: req.user.school },
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Attendance recorded',
    attendanceDoc,
  });
});

export const getAttendanceForDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, 'A date query parameter is required');
  }

  const attendanceDoc = await Attendance.findOne({
    class: req.classDoc._id,
    date: toUtcMidnight(date),
  }).populate('attendanceRecords.student', 'name registrationNumber');

  if (!attendanceDoc) {
    throw new ApiError(404, 'No attendance recorded for that date');
  }

  res.status(200).json({ success: true, attendanceDoc });
});

export const getClassAttendance = asyncHandler(async (req, res) => {
  const attendanceRecords = await Attendance.find({ class: req.classDoc._id })
    .populate('attendanceRecords.student', 'name registrationNumber')
    .sort({ date: -1 });

  res.status(200).json({ success: true, attendanceRecords });
});

/** A student's own attendance history, flattened to one entry per day. */
export const getMyAttendance = asyncHandler(async (req, res) => {
  const docs = await Attendance.find({
    school: req.user.school,
    'attendanceRecords.student': req.user._id,
  })
    .select('date attendanceRecords')
    .sort({ date: -1 });

  const attendanceRecords = docs.map((doc) => {
    const mine = doc.attendanceRecords.find((record) =>
      record.student.equals(req.user._id)
    );

    return { _id: doc._id, date: doc.date, present: mine ? mine.present : false };
  });

  const total = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.present).length;

  res.status(200).json({
    success: true,
    attendanceRecords,
    summary: {
      total,
      present: presentCount,
      absent: total - presentCount,
      percentage: total === 0 ? null : Math.round((presentCount / total) * 1000) / 10,
    },
  });
});
