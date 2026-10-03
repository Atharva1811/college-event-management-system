import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

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

  if (status && status !== 'All') {
    filter.status = status;
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

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = order === 'desc' ? -1 : 1;
  const sortOption = { [sort]: sortDirection };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'name email department avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Event.countDocuments(filter),
  ]);

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

  const enrichedEvents = events.map((ev) => {
    const evObj = ev.toObject();
    const registeredCount = countMap[ev._id.toString()] || 0;
    return {
      ...evObj,
      registeredCount,
      seatsRemaining: Math.max(0, ev.capacity - registeredCount),
      isFull: registeredCount >= ev.capacity,
    };
  });

  return {
    events: enrichedEvents,
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
  return {
    ...eventObj,
    registeredCount,
    seatsRemaining: Math.max(0, event.capacity - registeredCount),
    isFull: registeredCount >= event.capacity,
  };
};

export const createEvent = async (eventData, organizerId) => {
  const event = await Event.create({
    ...eventData,
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

  Object.assign(event, updateData);
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

  event.status = 'cancelled';
  await event.save();
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

  // Delete registrations associated with this event
  await Registration.deleteMany({ event: id });
  await Event.findByIdAndDelete(id);
  return { message: 'Event and associated registrations deleted successfully' };
};
