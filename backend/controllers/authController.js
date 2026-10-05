import * as authService from '../services/authService.js';
import User from '../models/User.js';
import { isConnected } from '../config/db.js';

export const register = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { name, email, password, phone, department, role } = req.body;
    const result = await authService.registerUser({
      name,
      email,
      password,
      phone,
      department,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to CEMS.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const applyOrganizer = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { name, email, password, phone, department, reason } = req.body;
    const result = await authService.applyOrganizer({
      name,
      email,
      password,
      phone,
      department,
      reason,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.applicant,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const applyAdmin = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { name, email, password, phone, department, reason } = req.body;
    const result = await authService.applyAdmin({
      name,
      email,
      password,
      phone,
      department,
      reason,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.applicant,
    });
  } catch (error) {
    next(error);
  }
};

export const applyOrganizerUpgrade = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { department, reason } = req.body;
    const result = await authService.applyOrganizerUpgrade(req.user._id, {
      department,
      reason,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(200).json({
        success: true,
        data: req.user,
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Suspension heartbeat detection (Requirement 12)
    if (user.status === 'suspended' || !user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: user.suspensionReason || 'Your account has been suspended by the administrator.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const token = req.body?.token || req.params?.token;
    const { password } = req.body || {};

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RESET_TOKEN',
        message: 'This password reset link is invalid or has expired.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      });
    }

    const result = await authService.resetPassword(token, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
