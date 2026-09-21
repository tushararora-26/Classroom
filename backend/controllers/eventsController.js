import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Event } from '../models/eventsSchema.js';

export const createEvent = asyncHandler(async (req, res) => {
  const { title, date, description } = req.body;

  if (!title || !date || !description) {
    throw new ApiError(400, 'Title, date and description are all required');
  }

  const event = await Event.create({
    title,
    date,
    description,
    school: req.user.school,
  });

  res.status(201).json({ success: true, message: 'Event created', event });
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ school: req.user.school }).sort({ date: 1 });

  res.status(200).json({ success: true, events });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const deleted = await Event.findOneAndDelete({
    _id: req.params.id,
    school: req.user.school,
  });

  if (!deleted) {
    throw new ApiError(404, 'Event not found');
  }

  res.status(200).json({ success: true, message: 'Event deleted' });
});
