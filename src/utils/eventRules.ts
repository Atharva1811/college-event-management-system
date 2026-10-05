import { EventStatus } from '../types';

import { parseTimeRange, timeToMinutes, timesOverlap } from './dateTimeUtils';

/**
 * Extracts normalized Date and start/end DateTimes for an event.
 */
export function getEventDateTimes(dateInput: string | Date, timeInput?: string) {
  const baseDate = new Date(dateInput);
  const year = !isNaN(baseDate.getTime()) ? baseDate.getFullYear() : new Date().getFullYear();
  const month = !isNaN(baseDate.getTime()) ? baseDate.getMonth() : new Date().getMonth();
  const day = !isNaN(baseDate.getTime()) ? baseDate.getDate() : new Date().getDate();

  const { startTime, endTime } = parseTimeRange(timeInput || '09:00 AM - 11:00 AM');
  const startMins = timeToMinutes(startTime);
  const endMins = endTime ? timeToMinutes(endTime) : startMins + 120;

  const startDateTime = new Date(year, month, day, Math.floor(startMins / 60), startMins % 60, 0, 0);
  let endDateTime = new Date(year, month, day, Math.floor(endMins / 60), endMins % 60, 0, 0);

  if (endDateTime <= startDateTime) {
    endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration fallback
  }

  return { startDateTime, endDateTime };
}

/**
 * Centralized Authoritative Event Status Calculation.
 *
 * Rules:
 *  - CANCELLED: If an event has been explicitly cancelled, it remains CANCELLED.
 *  - UPCOMING: Current date/time is before event start.
 *  - ONGOING: Current date/time is within event duration.
 *  - COMPLETED: Current date/time is after event end.
 */
export function calculateEventStatus(event: {
  status?: string;
  date: string | Date;
  time?: string;
}): EventStatus {
  if (event.status === 'cancelled') {
    return 'cancelled';
  }

  try {
    const { startDateTime, endDateTime } = getEventDateTimes(event.date, event.time);
    const now = new Date();

    if (now < startDateTime) {
      return 'upcoming';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  } catch {
    return (event.status as EventStatus) || 'upcoming';
  }
}

/**
 * Validates that an event can be edited.
 * Ongoing, Completed, and Cancelled events CANNOT be edited.
 */
export function assertCanUpdateEvent(event: { status?: string; date: string | Date; time?: string }) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'ongoing') {
    const error: any = new Error('Ongoing events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error: any = new Error('Completed events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'cancelled') {
    const error: any = new Error('Cancelled events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
}

/**
 * Validates that an event can be cancelled.
 * Cannot cancel completed, ongoing, or already cancelled events.
 */
export function assertCanCancelEvent(event: { status?: string; date: string | Date; time?: string }) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'cancelled') {
    const error: any = new Error('Event is already cancelled.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'ongoing') {
    const error: any = new Error('Cannot cancel an event that has already started.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error: any = new Error('Completed events cannot be cancelled.');
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Validates that an event can be deleted.
 * Ongoing and completed events CANNOT be deleted.
 */
export function assertCanDeleteEvent(event: { status?: string; date: string | Date; time?: string }) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'ongoing') {
    const error: any = new Error('Ongoing events cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error: any = new Error('Completed events cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }
}

/**
 * Checks if candidate event creates a venue + date + time conflict with any existing event.
 */
export function checkVenueConflict(
  candidate: { date: string | Date; time: string; venue: string; id?: string },
  existingEvents: Array<{ _id: string; date: string | Date; time: string; venue: string; status?: string }>
): boolean {
  const candidateDateStr = new Date(candidate.date).toISOString().substring(0, 10);
  const candidateVenue = candidate.venue.trim().toLowerCase();

  for (const ev of existingEvents) {
    // Exclude self when editing
    if (candidate.id && String(ev._id) === String(candidate.id)) {
      continue;
    }

    // Cancelled events do not block new events
    if (ev.status === 'cancelled') {
      continue;
    }

    // Check same date (calendar day)
    const evDateStr = new Date(ev.date).toISOString().substring(0, 10);
    if (evDateStr !== candidateDateStr) {
      continue;
    }

    // Check same venue
    if (ev.venue.trim().toLowerCase() !== candidateVenue) {
      continue;
    }

    // Check time overlap
    if (timesOverlap(candidate.time, ev.time)) {
      return true; // Conflict detected!
    }
  }

  return false;
}
