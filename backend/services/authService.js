import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { notifyAdmins } from './notificationService.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET || 'cems_fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const registerUser = async ({ name, email, password, phone, department, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Strict academic security: Public registration always creates STUDENT accounts
  const assignedRole = 'student';

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    department: department || 'Computer Science',
    role: assignedRole,
  });

  const token = generateToken(user);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      avatar: user.avatar,
    },
    token,
  };
};

export const applyOrganizer = async ({ name, email, password, phone, department, reason }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    department: department || 'Computer Science',
    role: 'organizer',
    organizerStatus: 'pending',
    isActive: false, // inactive until admin approval
    applicationReason: reason || '',
  });

  // Notify system administrators of new organizer application
  await notifyAdmins({
    type: 'organizer_application',
    title: 'New Faculty Application',
    message: `New faculty organizer application received from ${name} (${department}).`,
    relatedEvent: null,
  });

  return {
    message: 'Your organizer application has been submitted and is currently pending administrative review.',
    applicant: {
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      status: 'pending',
    },
  };
};

export const applyAdmin = async ({ name, email, password, phone, department, reason }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Requirement 7: Public registration never creates active Admin directly
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    department: department || 'General',
    role: 'student',
    adminStatus: 'pending',
    adminReason: reason || '',
    isActive: false, // Inactive until approved by an existing authorized admin
  });

  await notifyAdmins({
    type: 'admin_application',
    title: 'New Administrator Application',
    message: `New administrator access request received from ${name} (${department || 'General'}).`,
    relatedEvent: null,
  });

  return {
    message: 'Your administrator application has been submitted and is currently pending review by an active administrator.',
    applicant: {
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      adminStatus: 'pending',
    },
  };
};

export const applyOrganizerUpgrade = async (userId, { department, reason }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'admin') {
    return { message: 'You already possess administrator privileges.', user };
  }

  if (user.role === 'organizer') {
    return { message: 'You are already an authorized organizer.', user };
  }

  if (user.organizerStatus === 'pending') {
    return { message: 'Your organizer upgrade application is already pending review.', user };
  }

  user.organizerStatus = 'pending';
  user.applicationReason = reason || '';
  if (department) {
    user.department = department;
  }

  await user.save();

  await notifyAdmins({
    type: 'organizer_application',
    title: 'Student Organizer Application',
    message: `Registered student ${user.name} applied to become a faculty/department organizer (${user.department}).`,
    relatedEvent: null,
  });

  return {
    message: 'Your application to become an event organizer has been submitted for administrative review.',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      organizerStatus: user.organizerStatus,
    },
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Check account suspension (Requirements 10, 11)
  if (user.status === 'suspended') {
    const error = new Error(user.suspensionReason || 'Your account has been suspended by the administrator.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_SUSPENDED';
    throw error;
  }

  // Check organizer approval status
  if (user.role === 'organizer') {
    if (user.organizerStatus === 'pending') {
      const error = new Error('Your organizer application is currently pending admin approval.');
      error.statusCode = 403;
      throw error;
    }
    if (user.organizerStatus === 'denied') {
      const error = new Error('Your organizer application was denied. You cannot log in as an organizer.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Check admin application approval status
  if (user.adminStatus === 'pending') {
    const error = new Error('Your administrator application is currently pending review by an active administrator.');
    error.statusCode = 403;
    throw error;
  }
  if (user.adminStatus === 'denied') {
    const error = new Error('Your administrator application was denied by the system administrator.');
    error.statusCode = 403;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('This account has been deactivated. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      avatar: user.avatar,
      status: user.status,
      organizerStatus: user.organizerStatus,
      adminStatus: user.adminStatus,
    },
    token,
  };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email address, password recovery instructions have been sent.',
    };
  }

  // Generate crypto random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await user.save();

  return {
    success: true,
    message: 'If an account exists with this email address, password recovery instructions have been sent.',
    // Returning resetToken for development / non-SMTP verification flows
    resetToken,
  };
};

export const resetPassword = async (token, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return {
    success: true,
    message: 'Password reset successful! You may now log in with your new password.',
  };
};
