import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Assignment } from '../models/assignmentSchema.js';
import { Submission } from '../models/submissionSchema.js';
import { Class } from '../models/classSchema.js';

export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, classId, deadline } = req.body;

  if (!title || !description || !classId || !deadline) {
    throw new ApiError(400, 'Title, description, class and deadline are all required');
  }

  const classDoc = await Class.findOne({
    _id: classId,
    school: req.user.school,
    teachers: req.user._id,
  });

  if (!classDoc) {
    throw new ApiError(403, 'You do not teach this class');
  }

  const assignment = await Assignment.create({
    title,
    description,
    class: classDoc._id,
    teacher: req.user._id,
    school: req.user.school,
    deadline,
  });

  res.status(201).json({ success: true, message: 'Assignment created', assignment });
});

/** Assignments across every class the calling teacher teaches. */
export const getMyTeachingAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({
    school: req.user.school,
    teacher: req.user._id,
  })
    .populate('class', 'class')
    .sort({ deadline: 1 });

  res.status(200).json({ success: true, assignments });
});

export const getAssignmentsByClassId = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({
    class: req.classDoc._id,
    school: req.user.school,
  })
    .populate('class', 'class')
    .populate('teacher', 'name')
    .sort({ deadline: 1 });

  res.status(200).json({ success: true, assignments });
});

/** Assignments for the calling student's own class, with their submission state. */
export const getMyAssignments = asyncHandler(async (req, res) => {
  if (!req.user.class) {
    return res.status(200).json({ success: true, assignments: [] });
  }

  const assignments = await Assignment.find({
    class: req.user.class,
    school: req.user.school,
  })
    .populate('class', 'class')
    .populate('teacher', 'name')
    .sort({ deadline: 1 })
    .lean();

  const submissions = await Submission.find({
    student: req.user._id,
    assignment: { $in: assignments.map((a) => a._id) },
  }).lean();

  const byAssignment = new Map(submissions.map((s) => [s.assignment.toString(), s]));

  res.status(200).json({
    success: true,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      submission: byAssignment.get(assignment._id.toString()) || null,
    })),
  });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    school: req.user.school,
    // A teacher may only delete their own assignment; an admin may delete any.
    ...(req.user.role === 'teacher' ? { teacher: req.user._id } : {}),
  };

  const assignment = await Assignment.findOne(filter);

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  await Submission.deleteMany({ assignment: assignment._id });
  await Assignment.findByIdAndDelete(assignment._id);

  res.status(200).json({ success: true, message: 'Assignment deleted' });
});
