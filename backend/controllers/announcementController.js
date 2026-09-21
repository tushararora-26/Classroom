import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Announcement } from '../models/announcemntSchema.js';

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, announcement } = req.body;

  if (!announcement) {
    throw new ApiError(400, 'An announcement body is required');
  }

  const created = await Announcement.create({
    // Older clients posted a body with no title; fall back rather than reject.
    title: title || 'Announcement',
    announcement,
    school: req.user.school,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Announcement created', announcement: created });
});

export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const announcement = await Announcement.find({ school: req.user.school }).sort({
    createdAt: -1,
  });

  res.status(200).json({ success: true, announcement });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const deleted = await Announcement.findOneAndDelete({
    _id: req.params.id,
    school: req.user.school,
  });

  if (!deleted) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.status(200).json({ success: true, message: 'Announcement deleted' });
});
