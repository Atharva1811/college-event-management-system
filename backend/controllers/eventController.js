import * as eventService from '../services/eventService.js';
import { isConnected } from '../config/db.js';

export const getEvents = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const result = await eventService.listEvents(req.query);
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const event = await eventService.createEvent(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const updated = await eventService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const cancelled = await eventService.cancelEvent(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Event marked as cancelled.',
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const result = await eventService.deleteEvent(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
