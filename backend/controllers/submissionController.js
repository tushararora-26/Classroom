import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Assignment } from '../models/assignmentSchema.js';
import { Submission } from '../models/submissionSchema.js';
import { Class } from '../models/classSchema.js';

const loadAssignment = async (assignmentId, school) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, school });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  return assignment;
};

/** A student submits or re-submits their own work. */
export const submitAssignment = asyncHandler(async (req, res) => {
  const { content, fileUrl } = req.body;

  if (!content && !fileUrl) {
    throw new ApiError(400, 'Provide either written content or a file link');
  }

  const assignment = await loadAssignment(req.params.id, req.user.school);

  if (!req.user.class || !assignment.class.equals(req.user.class)) {
    throw new ApiError(403, 'This assignment is not for your class');
  }

  if (assignment.deadline.getTime() < Date.now()) {
    throw new ApiError(409, 'The deadline for this assignment has passed');
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      $set: {
        content: content || '',
        fileUrl: fileUrl || '',
        submittedAt: new Date(),
        // Re-submitting invalidates any previous grade.
        grade: null,
        feedback: '',
        gradedAt: null,
        gradedBy: null,
      },
      $setOnInsert: {
        assignment: assignment._id,
        student: req.user._id,
        school: req.user.school,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json({ success: true, message: 'Assignment submitted', submission });
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .populate({ path: 'assignment', select: 'title deadline class' })
    .sort({ submittedAt: -1 });

  res.status(200).json({ success: true, submissions });
});

/**
 * Teacher/admin view of one assignment: who submitted, and who has not.
 * The roster is included because "nobody has submitted" and "three people are
 * missing" look identical from a list of submissions alone.
 */
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await loadAssignment(req.params.id, req.user.school);

  if (req.user.role === 'teacher' && !assignment.teacher.equals(req.user._id)) {
    throw new ApiError(403, 'This is not your assignment');
  }

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student', 'name registrationNumber')
    .populate('gradedBy', 'name')
    .sort({ submittedAt: -1 });

  const classDoc = await Class.findById(assignment.class).populate(
    'students',
    'name registrationNumber'
  );

  const submitted = new Set(submissions.map((s) => s.student._id.toString()));
  const missing = (classDoc?.students || []).filter(
    (student) => !submitted.has(student._id.toString())
  );

  res.status(200).json({ success: true, assignment, submissions, missing });
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { grade, feedback } = req.body;

  if (!grade) {
    throw new ApiError(400, 'A grade is required');
  }

  const submission = await Submission.findOne({
    _id: req.params.id,
    school: req.user.school,
  });

  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  const assignment = await Assignment.findById(submission.assignment);

  if (req.user.role === 'teacher' && !assignment.teacher.equals(req.user._id)) {
    throw new ApiError(403, 'This is not your assignment');
  }

  submission.grade = grade;
  submission.feedback = feedback || '';
  submission.gradedAt = new Date();
  submission.gradedBy = req.user.role === 'teacher' ? req.user._id : null;
  await submission.save();

  res.status(200).json({ success: true, message: 'Submission graded', submission });
});
