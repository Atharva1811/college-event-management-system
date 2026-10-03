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

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
