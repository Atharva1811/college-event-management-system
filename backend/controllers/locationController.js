import * as locationService from '../services/locationService.js';
import { isConnected } from '../config/db.js';

export const getLocations = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const result = await locationService.listLocations(req.query, req.user);
    res.status(200).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getLocation = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const location = await locationService.getLocationById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Location retrieved successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const location = await locationService.createLocation(req.body, req.user);
    res.status(201).json({
      success: true,
      message:
        req.user.role === 'admin'
          ? 'Location created and activated successfully.'
          : 'Location request submitted successfully. Pending administrative review.',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const location = await locationService.updateLocation(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Location updated successfully.',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocationStatus = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const location = await locationService.updateLocationStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `Location status updated to ${req.body.status}.`,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateLocation = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    const location = await locationService.deactivateLocation(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Location deactivated successfully.',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};
