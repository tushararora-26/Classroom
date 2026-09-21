import { ApiError } from './ApiError.js';

/**
 * Attendance is per day, but the original code compared raw `new Date(value)`
 * results, so two marks on the same day at different times never matched and
 * silently created duplicate documents. Everything is pinned to UTC midnight.
 */
export const toUtcMidnight = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, 'Invalid date');
  }

  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
};
