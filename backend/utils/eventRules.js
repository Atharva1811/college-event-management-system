import Event from '../models/Event.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

/**
 * Parses a combined time string into separate startTime and endTime.
 * Examples:
 *  "10:00 AM - 04:00 PM" -> { startTime: "10:00 AM", endTime: "04:00 PM" }
 *  "10:00 AM" -> { startTime: "10:00 AM", endTime: "" }
 */
export function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { startTime: '', endTime: '' };
  }

  const parts = timeStr.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return {
      startTime: parts[0].trim(),
      endTime: parts[1].trim(),
    };
  }

  return {
    startTime: timeStr.trim(),
    endTime: '',
  };
}

/**
 * Converts a time string into minutes from midnight (0 - 1440).
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Determines whether two time intervals overlap.
 */
export function timesOverlap(timeA, timeB) {
  if (!timeA || !timeB) return false;
  if (timeA.trim().toLowerCase() === timeB.trim().toLowerCase()) return true;

  const rangeA = parseTimeRange(timeA);
  const rangeB = parseTimeRange(timeB);

  let startA = timeToMinutes(rangeA.startTime);
  let endA = rangeA.endTime ? timeToMinutes(rangeA.endTime) : startA + 120;
  if (endA <= startA) endA += 1440;

  let startB = timeToMinutes(rangeB.startTime);
  let endB = rangeB.endTime ? timeToMinutes(rangeB.endTime) : startB + 120;
  if (endB <= startB) endB += 1440;

  return startA < endB && endA > startB;
}

/**
 * Constructs start and end Date objects for an event.
 */
export function getEventDateTimes(dateInput, timeInput) {
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
    endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
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
export function calculateEventStatus(event) {
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
    return event.status || 'upcoming';
  }
}

/**
 * Validates date & time constraints for event creation / editing:
 * - Event start cannot be in the past
 * - Registration deadline cannot be in the past
 * - Registration deadline cannot be after the event start
 */
export function validateEventDateTime({ date, time, registrationDeadline }) {
  const now = new Date();
  const { startDateTime } = getEventDateTimes(date, time);

  if (startDateTime.getTime() < now.getTime()) {
    const error = new Error('Event date and time cannot be in the past.');
    error.statusCode = 400;
    throw error;
  }

  if (registrationDeadline) {
    const deadlineDate = new Date(registrationDeadline);
    // End of deadline day or exact time
    const deadlineEndOfDay = new Date(deadlineDate);
    deadlineEndOfDay.setHours(23, 59, 59, 999);

    if (deadlineEndOfDay.getTime() < now.getTime()) {
      const error = new Error('Registration deadline cannot be in the past.');
      error.statusCode = 400;
      throw error;
    }

    if (deadlineDate.getTime() > startDateTime.getTime()) {
      const error = new Error('Registration deadline cannot be after the event date and time.');
      error.statusCode = 400;
      throw error;
    }
  }
}

/**
 * Asserts event capacity does not exceed approved location capacity.
 */
export function assertLocationCapacity(eventCapacity, locationCapacity) {
  if (locationCapacity && Number(eventCapacity) > Number(locationCapacity)) {
    const error = new Error(`Event capacity (${eventCapacity}) cannot exceed location capacity of ${locationCapacity}.`);
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Checks location and venue conflict against MongoDB Event collection:
 * Same date + overlapping time + same location (or venue) -> Conflict (409)!
 * Cancelled events -> Ignored
 */
export async function checkVenueConflict({ date, time, venue, locationId, excludeEventId }) {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' },
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  // Find events on the same calendar day
  const sameDayEvents = await Event.find(query);
  const normalizedVenue = venue ? venue.trim().toLowerCase() : '';

  for (const ev of sameDayEvents) {
    let sameLocation = false;

    // Check location ObjectId reference match
    if (locationId && ev.location) {
      sameLocation = ev.location.toString() === locationId.toString();
    } else if (normalizedVenue && ev.venue) {
      sameLocation = ev.venue.trim().toLowerCase() === normalizedVenue;
    }

    if (sameLocation) {
      if (timesOverlap(time, ev.time)) {
        const error = new Error('A non-cancelled event is already scheduled at this location/venue for the selected date and time.');
        error.statusCode = 409;
        throw error;
      }
    }
  }
}

/**
 * Asserts an event can be updated:
 * Ongoing, Completed, and Cancelled events CANNOT be edited.
 */
export function assertCanUpdateEvent(event) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'ongoing') {
    const error = new Error('Ongoing events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error = new Error('Completed events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'cancelled') {
    const error = new Error('Cancelled events cannot be updated.');
    error.statusCode = 403;
    throw error;
  }
}

/**
 * Asserts an event can be cancelled:
 * Cannot cancel completed, ongoing, or already cancelled events.
 */
export function assertCanCancelEvent(event) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'cancelled') {
    const error = new Error('Event is already cancelled.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'ongoing') {
    const error = new Error('Cannot cancel an event that has already started.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error = new Error('Completed events cannot be cancelled.');
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Asserts an event can be deleted:
 * Ongoing and completed events CANNOT be deleted.
 */
export function assertCanDeleteEvent(event) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'ongoing') {
    const error = new Error('Ongoing events cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error = new Error('Completed events cannot be deleted.');
    error.statusCode = 403;
    throw error;
  }
}

/**
 * Asserts a student can register for an event.
 */
export function assertCanRegister({ event, registeredCount }) {
  const currentStatus = calculateEventStatus(event);

  if (currentStatus === 'cancelled') {
    const error = new Error('This event has been cancelled and is no longer accepting registrations.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'completed') {
    const error = new Error('This event has already concluded.');
    error.statusCode = 400;
    throw error;
  }
  if (currentStatus === 'ongoing') {
    const error = new Error('This event is currently in progress. Registrations are closed.');
    error.statusCode = 400;
    throw error;
  }

  const { startDateTime } = getEventDateTimes(event.date, event.time);
  if (startDateTime.getTime() < Date.now()) {
    const error = new Error('This event has already started.');
    error.statusCode = 400;
    throw error;
  }

  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    const error = new Error('The registration deadline for this event has passed.');
    error.statusCode = 400;
    throw error;
  }

  if (registeredCount >= event.capacity) {
    const error = new Error('Event capacity has been reached. No seats available.');
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Asserts an organizer can be deleted:
 * Reject deletion if organizer has any ongoing events.
 */
export async function assertCanDeleteOrganizer(organizerId) {
  const events = await Event.find({ organizer: organizerId });
  for (const ev of events) {
    const status = calculateEventStatus(ev);
    if (status === 'ongoing') {
      const error = new Error('Organizer cannot be deleted because they are currently hosting an ongoing event.');
      error.statusCode = 400;
      throw error;
    }
  }
}

/**
 * Handles organizer deletion with deterministic upcoming event reassignment:
 * - Ongoing events: BLOCKS deletion.
 * - Upcoming events: Finds eligible replacement in same department (active, non-suspended, fewest upcoming events).
 *   If no replacement: BLOCKS deletion with clear message.
 *   If replacement found: reassigns upcoming events and notifies replacement organizer and Admin.
 * - Historical events (completed/cancelled): retained as-is without rewriting history.
 */
export async function handleOrganizerDeletion(organizerUser) {
  const organizerId = organizerUser._id;
  const events = await Event.find({ organizer: organizerId });

  // 1. Block if ANY event is ongoing
  for (const ev of events) {
    const status = calculateEventStatus(ev);
    if (status === 'ongoing') {
      const error = new Error('Organizer cannot be deleted because they are currently hosting an ongoing event.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 2. Identify upcoming events that require reassignment
  const upcomingEvents = events.filter((ev) => calculateEventStatus(ev) === 'upcoming');

  if (upcomingEvents.length > 0) {
    // Find eligible replacements in the same department
    const candidates = await User.find({
      _id: { $ne: organizerId },
      role: 'organizer',
      department: organizerUser.department,
      isActive: true,
      status: { $ne: 'suspended' },
      organizerStatus: 'approved',
    });

    if (candidates.length === 0) {
      const error = new Error(
        `Organizer cannot be deleted because their upcoming events have no eligible replacement organizer in the same department (${organizerUser.department}).`
      );
      error.statusCode = 400;
      throw error;
    }

    // Workload calculation: count upcoming events for each candidate
    const candidateWorkload = {};
    for (const c of candidates) {
      const cEvents = await Event.find({ organizer: c._id });
      const upCount = cEvents.filter((e) => calculateEventStatus(e) === 'upcoming').length;
      candidateWorkload[c._id.toString()] = upCount;
    }

    // Deterministically reassign each upcoming event to candidate with lowest workload
    for (const ev of upcomingEvents) {
      candidates.sort((a, b) => {
        const countA = candidateWorkload[a._id.toString()] || 0;
        const countB = candidateWorkload[b._id.toString()] || 0;
        if (countA !== countB) return countA - countB;
        return a._id.toString().localeCompare(b._id.toString());
      });

      const chosenCandidate = candidates[0];
      ev.organizer = chosenCandidate._id;
      await ev.save();

      candidateWorkload[chosenCandidate._id.toString()] =
        (candidateWorkload[chosenCandidate._id.toString()] || 0) + 1;

      // Notify replacement organizer
      await createNotification({
        recipient: chosenCandidate._id,
        type: 'event_reassigned',
        title: 'Event Reassigned to You',
        message: `The upcoming event "${ev.title}" previously organized by ${organizerUser.name} has been reassigned to you.`,
        relatedEvent: ev._id,
      });
    }

    // Notify administrators of reassignment
    await notifyAdmins({
      type: 'event_reassigned',
      title: 'Upcoming Events Reassigned',
      message: `${upcomingEvents.length} upcoming event(s) previously organized by ${organizerUser.name} (${organizerUser.department}) have been safely reassigned following organizer deletion.`,
      relatedEvent: null,
    });
  }
}
