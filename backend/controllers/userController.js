import User from '../models/User.js';
import { isConnected } from '../config/db.js';

export const getUsers = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const { role, department, search, page = 1, limit = 10, isActive } = req.query;
    const filter = {};

    if (role && role !== 'All') {
      filter.role = role.toLowerCase();
    }

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Only Admin can update other users, or user updating self
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify this user profile.',
      });
    }

    const { name, phone, department, avatar, isActive, role } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;

    // Only admin can change role or isActive status
    if (req.user.role === 'admin') {
      if (typeof isActive === 'boolean') user.isActive = isActive;
      if (role && ['admin', 'organizer', 'student'].includes(role)) user.role = role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
