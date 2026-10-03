import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

export const registerForEvent = async (studentId, eventId) => {
  // 1. Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify event is not cancelled
  if (event.status === 'cancelled') {
    const error = new Error('This event has been cancelled and is no longer accepting registrations.');
    error.statusCode = 400;
    throw error;
  }

  if (event.status === 'completed') {
    const error = new Error('This event has already concluded.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify registration deadline
  if (new Date() > new Date(event.registrationDeadline)) {
    const error = new Error('The registration deadline for this event has passed.');
    error.statusCode = 400;
    throw error;
  }

  // 4 & 5. Count currently active registered students and compare with capacity
  const activeRegistrationsCount = await Registration.countDocuments({
    event: eventId,
    status: 'registered',
  });

  if (activeRegistrationsCount >= event.capacity) {
    const error = new Error('Event capacity has been reached. No seats available.');
    error.statusCode = 400;
    throw error;
  }

  // 6. Check whether student already has an existing registration record
  const existingRecord = await Registration.findOne({
    student: studentId,
    event: eventId,
  });

  if (existingRecord) {
    if (existingRecord.status === 'registered') {
      const error = new Error('You are already registered for this event.');
      error.statusCode = 400;
      throw error;
    }

    // 7. If cancelled registration exists, reactivate it (ADBMS state-preservation demonstration)
    existingRecord.status = 'registered';
    existingRecord.registeredAt = new Date();
    await existingRecord.save();

    return await existingRecord.populate([
      { path: 'event', populate: { path: 'organizer', select: 'name email' } },
      { path: 'student', select: 'name email department' },
    ]);
  }

  // 8. Otherwise create a new registration
  const newRegistration = await Registration.create({
    student: studentId,
    event: eventId,
    status: 'registered',
    attendance: 'pending',
  });

  return await newRegistration.populate([
    { path: 'event', populate: { path: 'organizer', select: 'name email' } },
    { path: 'student', select: 'name email department' },
  ]);
};

export const cancelRegistration = async (registrationId, studentId, userRole) => {
  const registration = await Registration.findById(registrationId);
  if (!registration) {
    const error = new Error('Registration record not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole !== 'admin' && registration.student.toString() !== studentId.toString()) {
    const error = new Error('Forbidden: You can only cancel your own registrations.');
    error.statusCode = 403;
    throw error;
  }

  // Soft cancel: preserve the document history
  registration.status = 'cancelled';
  await registration.save();

  return registration;
};

export const getMyRegistrations = async (studentId) => {
  const registrations = await Registration.find({ student: studentId })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email department' },
    })
    .sort({ registeredAt: -1 });

  return registrations;
};

export const getEventParticipants = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && event.organizer.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You are not authorized to view participants for this event.');
    error.statusCode = 403;
    throw error;
  }

  const participants = await Registration.find({ event: eventId })
    .populate('student', 'name email department phone avatar')
    .sort({ registeredAt: 1 });

  return participants;
};

export const updateAttendance = async (registrationId, attendanceStatus, user) => {
  const registration = await Registration.findById(registrationId).populate('event');
  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role !== 'admin' &&
    registration.event.organizer.toString() !== user._id.toString()
  ) {
    const error = new Error('Forbidden: You are not authorized to manage attendance for this event.');
    error.statusCode = 403;
    throw error;
  }

  registration.attendance = attendanceStatus;
  await registration.save();

  return registration;
};

export const submitFeedback = async (registrationId, rating, feedback, studentId) => {
  const registration = await Registration.findById(registrationId).populate('event');
  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    throw error;
  }

  if (registration.student.toString() !== studentId.toString()) {
    const error = new Error('Forbidden: You can only provide feedback for your own registration.');
    error.statusCode = 403;
    throw error;
  }

  if (registration.event.status !== 'completed') {
    const error = new Error('Feedback can only be submitted for completed events.');
    error.statusCode = 400;
    throw error;
  }

  if (registration.rating) {
    const error = new Error('Feedback has already been submitted for this event.');
    error.statusCode = 400;
    throw error;
  }

  registration.rating = Number(rating);
  registration.feedback = feedback;
  await registration.save();

  return registration;
};
