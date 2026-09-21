import { Class } from '../models/classSchema.js';
import { Student } from '../models/studentSchema.js';
import { Teacher } from '../models/teacherSchema.js';
import { Assignment } from '../models/assignmentSchema.js';
import { Submission } from '../models/submissionSchema.js';
import { Notice } from '../models/noticeSchema.js';
import { Attendance } from '../models/attendanceSchema.js';

/**
 * The original code updated one side of every relationship, leaving the other
 * dangling. These helpers are the only sanctioned way to change enrolment and
 * staffing, so both sides always move together.
 */

export const enrolStudent = async (classDoc, student) => {
  await Class.updateOne({ _id: classDoc._id }, { $addToSet: { students: student._id } });
  await Student.updateOne({ _id: student._id }, { $set: { class: classDoc._id } });
};

export const unenrolStudent = async (classId, studentId) => {
  await Class.updateOne({ _id: classId }, { $pull: { students: studentId } });
  await Student.updateOne(
    { _id: studentId, class: classId },
    { $set: { class: null } }
  );
};

export const assignTeacher = async (classDoc, teacher) => {
  await Class.updateOne({ _id: classDoc._id }, { $addToSet: { teachers: teacher._id } });
  await Teacher.updateOne({ _id: teacher._id }, { $addToSet: { classes: classDoc._id } });
};

export const unassignTeacher = async (classId, teacherId) => {
  await Class.updateOne({ _id: classId }, { $pull: { teachers: teacherId } });
  await Teacher.updateOne({ _id: teacherId }, { $pull: { classes: classId } });
};

export const removeStudentEverywhere = async (studentId) => {
  await Class.updateMany({ students: studentId }, { $pull: { students: studentId } });
  await Submission.deleteMany({ student: studentId });
  await Attendance.updateMany(
    { 'attendanceRecords.student': studentId },
    { $pull: { attendanceRecords: { student: studentId } } }
  );
};

export const removeTeacherEverywhere = async (teacherId) => {
  await Class.updateMany({ teachers: teacherId }, { $pull: { teachers: teacherId } });
  await Class.updateMany(
    { 'subjects.teacher': teacherId },
    { $pull: { subjects: { teacher: teacherId } } }
  );
};

export const removeClassEverywhere = async (classId) => {
  await Student.updateMany({ class: classId }, { $set: { class: null } });
  await Teacher.updateMany({ classes: classId }, { $pull: { classes: classId } });

  const assignments = await Assignment.find({ class: classId }).select('_id');
  await Submission.deleteMany({ assignment: { $in: assignments.map((a) => a._id) } });

  await Assignment.deleteMany({ class: classId });
  await Notice.deleteMany({ class: classId });
  await Attendance.deleteMany({ class: classId });
};
