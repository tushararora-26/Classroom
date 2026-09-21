import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Notice } from '../models/noticeSchema.js';
import { Class } from '../models/classSchema.js';

export const createNotice = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    throw new ApiError(400, 'Title and content are required');
  }

  const notice = await Notice.create({
    title,
    content,
    class: req.classDoc._id,
    school: req.user.school,
    createdBy: req.user.role === 'teacher' ? req.user._id : undefined,
  });

  res.status(201).json({ success: true, message: 'Notice created', notice });
});

/** Notices for every class the calling teacher teaches. */
export const getMyTeachingNotices = asyncHandler(async (req, res) => {
  const classIds = await Class.find({
    teachers: req.user._id,
    school: req.user.school,
  }).distinct('_id');

  const notices = await Notice.find({
    class: { $in: classIds },
    school: req.user.school,
  })
    .populate('class', 'class')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, notices });
});

export const getAllNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({ school: req.user.school })
    .populate('class', 'class')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, notices });
});

export const getNoticesByClassId = asyncHandler(async (req, res) => {
  const notices = await Notice.find({
    class: req.classDoc._id,
    school: req.user.school,
  })
    .populate('class', 'class')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, notices });
});

/** Notices for the calling student's own class. */
export const getMyNotices = asyncHandler(async (req, res) => {
  if (!req.user.class) {
    return res.status(200).json({ success: true, notices: [] });
  }

  const notices = await Notice.find({
    class: req.user.class,
    school: req.user.school,
  })
    .populate('class', 'class')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, notices });
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    school: req.user.school,
    ...(req.user.role === 'teacher' ? { createdBy: req.user._id } : {}),
  };

  const notice = await Notice.findOneAndDelete(filter);

  if (!notice) {
    throw new ApiError(404, 'Notice not found');
  }

  res.status(200).json({ success: true, message: 'Notice deleted' });
});
