import Location from '../models/Location.js';
import Event from '../models/Event.js';
import { createNotification, notifyAdmins } from './notificationService.js';

export const listLocations = async (query = {}, user = null) => {
  const { status, department, accessType, search, page = 1, limit = 50 } = query;
  const filter = {};

  if (user && user.role === 'admin') {
    // Admin can see all or filter by query
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (department && department !== 'All') {
      filter.department = department;
    }
    if (accessType && accessType !== 'All') {
      filter.accessType = accessType;
    }
  } else if (user && user.role === 'organizer') {
    // Organizer sees active locations accessible to them, plus pending ones they requested
    const deptMatch = user.department || 'General';
    filter.$or = [
      { status: 'active', accessType: 'global' },
      { status: 'active', accessType: 'department', department: deptMatch },
      { createdBy: user._id },
    ];
    if (status && status !== 'All') {
      filter.status = status;
    }
  } else {
    // Public / students view active global and department locations
    filter.status = 'active';
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    const searchConditions = [
      { name: searchRegex },
      { building: searchRegex },
      { room: searchRegex },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [locations, total] = await Promise.all([
    Location.find(filter)
      .populate('createdBy', 'name email department')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Location.countDocuments(filter),
  ]);

  return {
    locations,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getLocationById = async (id) => {
  const location = await Location.findById(id)
    .populate('createdBy', 'name email department')
    .populate('approvedBy', 'name email');

  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  return location;
};

export const createLocation = async (data, user) => {
  const isAdmin = user.role === 'admin';
  const status = isAdmin ? (data.status || 'active') : 'pending';

  const locationData = {
    name: data.name,
    building: data.building,
    floor: data.floor || '',
    room: data.room,
    description: data.description || '',
    capacity: Number(data.capacity),
    status,
    accessType: isAdmin ? (data.accessType || 'global') : (data.accessType || 'department'),
    department: isAdmin ? (data.department || 'General') : (user.department || 'General'),
    createdBy: user._id,
    approvedBy: isAdmin ? user._id : null,
    approvedAt: isAdmin ? new Date() : null,
  };

  const location = await Location.create(locationData);

  if (!isAdmin) {
    // Notify administrators of pending location request
    await notifyAdmins({
      type: 'location_request',
      title: 'New Location Request',
      message: `Faculty organizer ${user.name} (${user.department}) requested a new venue: "${location.name}" (${location.building}, Room ${location.room}, Capacity: ${location.capacity}).`,
      relatedEvent: null,
    });
  }

  return location.populate('createdBy', 'name email department');
};

export const updateLocation = async (id, data, user) => {
  if (user.role !== 'admin') {
    const error = new Error('Forbidden: Only administrators can update location details.');
    error.statusCode = 403;
    throw error;
  }

  const location = await Location.findById(id);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = [
    'name',
    'building',
    'floor',
    'room',
    'description',
    'capacity',
    'status',
    'accessType',
    'department',
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      if (field === 'capacity') {
        location[field] = Number(data[field]);
      } else {
        location[field] = data[field];
      }
    }
  });

  await location.save();
  return location.populate('createdBy', 'name email department');
};

export const updateLocationStatus = async (id, { status }, adminUser) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Forbidden: Only administrators can change location approval status.');
    error.statusCode = 403;
    throw error;
  }

  if (!['active', 'inactive', 'pending', 'denied'].includes(status)) {
    const error = new Error('Invalid status. Allowed: active, inactive, pending, denied.');
    error.statusCode = 400;
    throw error;
  }

  const location = await Location.findById(id);
  if (!location) {
    const error = new Error('Location not found');
    error.statusCode = 404;
    throw error;
  }

  location.status = status;
  if (status === 'active') {
    location.approvedBy = adminUser._id;
    location.approvedAt = new Date();
  }

  await location.save();

  // Notify organizer who submitted the request
  if (location.createdBy) {
    await createNotification({
      recipient: location.createdBy,
      type: status === 'active' ? 'location_approved' : 'location_denied',
      title: status === 'active' ? 'Location Request Approved' : 'Location Request Update',
      message:
        status === 'active'
          ? `Your location request for "${location.name}" (${location.building}, Room ${location.room}) has been approved and is now active for events.`
          : `Your location request for "${location.name}" has been marked as ${status} by the administrator.`,
    });
  }

  return location;
};

export const deactivateLocation = async (id, adminUser) => {
  return updateLocationStatus(id, { status: 'inactive' }, adminUser);
};
