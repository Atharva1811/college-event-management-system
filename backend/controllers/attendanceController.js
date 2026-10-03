import * as registrationService from '../services/registrationService.js';
import { isConnected } from '../config/db.js';

export const updateAttendance = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { attendance } = req.body;
    const updated = await registrationService.updateAttendance(
      req.params.id,
      attendance,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Attendance marked as '${attendance}'.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
