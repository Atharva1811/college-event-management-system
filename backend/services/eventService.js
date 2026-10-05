import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import {
  calculateEventStatus,
  checkVenueConflict,
  validateEventDateTime,
  assertCanUpdateEvent,
  assertCanCancelEvent,
  assertCanDeleteEvent,
} from '../utils/eventRules.js';
import { notifyUsers } from './notificationService.js';

export const listEvents = async (query = {}) => {
  const {
    category,
    status,
    organizer,
    search,
    page = 1,
    limit = 10,
    sort = 'date',
    order = 'asc',
  } = query;

  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (organizer) {
    filter.organizer = organizer;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } },
    ];
  }

  const sortDirection = order === 'desc' ? -1 : 1;
  const sortOption = { [sort]: sortDirection };

  // Fetch events for calculating real-time dynamic status
  const events = await Event.find(filter)
    .populate('organizer', 'name email department avatar')
    .sort(sortOption);

  // Attach registration counts
  const eventIds = events.map((e) => e._id);
  const registrationCounts = await Registration.aggregate([
    {
      $match: {
        event: { $in: eventIds },
        status: 'registered',
      },
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  registrationCounts.forEach((r) => {
    countMap[r._id.toString()] = r.count;
  });

  let enrichedEvents = events.map((ev) => {
    const evObj = ev.toObject();
    const registeredCount = countMap[ev._id.toString()] || 0;
    const dynamicStatus = calculateEventStatus(ev);

    return {
      ...evObj,
      status: dynamicStatus,
      registeredCount,
      seatsRemaining: Math.max(0, ev.capacity - registeredCount),
      isFull: registeredCount >= ev.capacity,
    };
  });

  // Filter by dynamic status if requested
  if (status && status !== 'All') {
    enrichedEvents = enrichedEvents.filter((e) => e.status === status.toLowerCase());
  }

  const total = enrichedEvents.length;
  const skip = (Number(page) - 1) * Number(limit);
  const paginatedEvents = enrichedEvents.slice(skip, skip + Number(limit));

  return {
    events: paginatedEvents,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getEventById = async (id) => {
  const event = await Event.findById(id).populate('organizer', 'name email department avatar');
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  const registeredCount = await Registration.countDocuments({
    event: id,
    status: 'registered',
  });

  const eventObj = event.toObject();
  const dynamicStatus = calculateEventStatus(event);

  return {
    ...eventObj,
    status: dynamicStatus,
    registeredCount,
    seatsRemaining: Math.max(0, event.capacity - registeredCount),
    isFull: registeredCount >= event.capacity,
  };
};

export const createEvent = async (eventData, organizerId) => {
  // 1. Validate date & time constraints (not in past, deadline logical)
  validateEventDateTime(eventData);

  // 2. Check venue conflict against existing scheduled events
  await checkVenueConflict({
    date: eventData.date,
    time: eventData.time,
    venue: eventData.venue,
  });

  // 3. Compute initial automatic event status
  const initialStatus = calculateEventStatus(eventData);

  const event = await Event.create({
    ...eventData,
    status: initialStatus,
    organizer: organizerId,
  });

  return event.populate('organizer', 'name email department avatar');
};

export const updateEvent = async (id, updateData, user) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: only admin or the event's organizer can update
  if (user.role !== 'admin' && event.organizer.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You are not authorized to update this event.');
    error.statusCode = 403;
    throw error;
  }

  // Enforcement: Ongoing, Completed, and Cancelled events cannot be edited
  assertCanUpdateEvent(event);

  // Capacity reduction validation: Cannot reduce capacity below current registered students
  if (updateData.capacity !== undefined) {
    const registeredCount = await Registration.countDocuments({
      event: id,
      status: 'registered',
    });

    if (Number(updateData.capacity) < registeredCount) {
      const error = new Error('Capacity cannot be reduced below the current number of registered students.');
      error.statusCode = 409;
      throw error;
    }
  }

  // If date, time, or venue are modified, re-validate and run conflict check
  const newDate = updateData.date || event.date;
  const newTime = updateData.time || event.time;
  const newVenue = updateData.venue || event.venue;
  const newDeadline = updateData.registrationDeadline || event.registrationDeadline;

  if (
    updateData.date ||
    updateData.time ||
    updateData.venue ||
    updateData.registrationDeadline
  ) {
    validateEventDateTime({
      date: newDate,
      time: newTime,
      registrationDeadline: newDeadline,
    });

    await checkVenueConflict({
      date: newDate,
      time: newTime,
      venue: newVenue,
      excludeEventId: id,
    });
  }

  Object.assign(event, updateData);

  // Recalculate status unless explicitly cancelled
  if (event.status !== 'cancelled') {
    event.status = calculateEventStatus(event);
  }

  await event.save();
  return event.populate('organizer', 'name email department avatar');
};

export const cancelEvent = async (id, user) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && event.organizer.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You cannot cancel an event you do not organize.');
    error.statusCode = 403;
    throw error;
  }

  // Enforcement: Cannot cancel completed, ongoing, or already cancelled events
  assertCanCancelEvent(event);

  event.status = 'cancelled';
  await event.save();

  // Notify registered students of cancellation
  try {
    const registrations = await Registration.find({
      event: id,
      status: 'registered',
    }).select('student');
    const studentIds = registrations.map((r) => r.student);

    await notifyUsers(studentIds, {
      type: 'event_cancelled',
      title: 'Event Cancelled',
      message: `The event "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()} has been cancelled by the organizer.`,
      relatedEvent: event._id,
    });
  } catch (err) {
    console.error('Failed to notify students on cancellation:', err.message);
  }

  return event;
};

export const deleteEvent = async (id, user) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && event.organizer.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You cannot delete an event you do not organize.');
    error.statusCode = 403;
    throw error;
  }

  // Enforcement: Ongoing and Completed events cannot be deleted
  assertCanDeleteEvent(event);

  // Notify registered students before deletion
  try {
    const registrations = await Registration.find({
      event: id,
      status: 'registered',
    }).select('student');
    const studentIds = registrations.map((r) => r.student);

    await notifyUsers(studentIds, {
      type: 'event_deleted',
      title: 'Event Removed',
      message: `The event "${event.title}" has been deleted and removed from the university schedule.`,
      relatedEvent: null,
    });
  } catch (err) {
    console.error('Failed to notify students on deletion:', err.message);
  }

  // Delete registrations associated with this event
  await Registration.deleteMany({ event: id });
  await Event.findByIdAndDelete(id);

  return { message: 'Event and associated registrations deleted successfully' };
};
