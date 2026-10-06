import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { notifyAdmins } from './notificationService.js';
import { sendPasswordResetEmail } from './emailService.js';

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
  const normalized = (email || '').toLowerCase().trim();
  const escaped = normalized.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  let user = await User.findOne({ email: normalized }).select('+password');
  if (!user) {
    user = await User.findOne({
      email: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') }
    }).select('+password');
  }

  // Support college alias / typo fallback between milind and milnd for sanjivani.edu.in
  if (!user) {
    if (normalized.includes('milind.atharva24@sanjivani.edu.in')) {
      user = await User.findOne({ email: 'milnd.atharva24@sanjivani.edu.in' }).select('+password');
    } else if (normalized.includes('milnd.atharva24@sanjivani.edu.in')) {
      user = await User.findOne({ email: 'milind.atharva24@sanjivani.edu.in' }).select('+password');
    }
  }

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

// In-memory sliding window for rate-limiting forgot password requests per email (Requirement 21)
const forgotPasswordAttempts = new Map();

const isRateLimited = (email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minute window
  const maxRequests = 5; // max 5 requests per 15 minutes per email

  const history = forgotPasswordAttempts.get(email) || [];
  const validHistory = history.filter((timestamp) => now - timestamp < windowMs);

  if (validHistory.length >= maxRequests) {
    return true;
  }

  validHistory.push(now);
  forgotPasswordAttempts.set(email, validHistory);
  return false;
};

export const forgotPassword = async (email) => {
  console.log('[FORGOT PASSWORD] Request received');

  if (!email || typeof email !== 'string') {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    error.code = 'INVALID_REQUEST';
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log('[FORGOT PASSWORD] Email normalized');
  console.log('[FORGOT PASSWORD] Normalized email:', normalizedEmail);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    error.code = 'INVALID_REQUEST';
    throw error;
  }

  // Anti-enumeration: Generic response regardless of whether account exists (Requirement 4, 20)
  const genericResponse = {
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  };

  // Lightweight abuse / flood protection (Requirement 21)
  if (isRateLimited(normalizedEmail)) {
    console.log('[FORGOT PASSWORD] Rate limit triggered');
    return genericResponse;
  }

  console.log('[FORGOT PASSWORD] User lookup started');
  const escaped = normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = await User.findOne({
      email: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') }
    });
  }

  // Support college alias / typo fallback between milind and milnd for sanjivani.edu.in
  if (!user) {
    if (normalizedEmail.includes('milind.atharva24@sanjivani.edu.in')) {
      user = await User.findOne({ email: 'milnd.atharva24@sanjivani.edu.in' });
    } else if (normalizedEmail.includes('milnd.atharva24@sanjivani.edu.in')) {
      user = await User.findOne({ email: 'milind.atharva24@sanjivani.edu.in' });
    }
  }

  console.log('[FORGOT PASSWORD] User found:', !!user);

  if (!user) {
    console.log('[FORGOT PASSWORD] User not found');
    return genericResponse;
  }

  console.log('[FORGOT PASSWORD] Account status checked');

  // Generate cryptographically secure random token (32 bytes = 64 hex chars) (Requirement 5)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  console.log('[FORGOT PASSWORD] Reset token generated');

  // Store hashed token and 30-minute expiration (Requirements 6, 7, 8)
  // Overwrites previous token, invalidating older tokens (Requirements 21, 48)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await user.save({ validateBeforeSave: false });
  console.log('[FORGOT PASSWORD] Reset token saved');
  console.log('[FORGOT PASSWORD] Reset URL generated');

  // Dispatch Brevo email with the raw unhashed token (Requirement 9, 10)
  // Deliver to normalizedEmail if it is a valid college email alias to reach the user's active mailbox
  const targetEmail = normalizedEmail.includes('sanjivani.edu.in') ? normalizedEmail : user.email;
  console.log('[FORGOT PASSWORD] Calling Brevo');
  const emailResult = await sendPasswordResetEmail({
    to: targetEmail,
    name: user.name,
    resetToken,
  });

  if (!emailResult.success) {
    // Revert token in MongoDB if email failed so user is not left with unsent token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(`[FORGOT PASSWORD] Brevo delivery failed (${emailResult.code || 'EMAIL_SEND_FAILED'}). Reverted token.`);

    const error = new Error('Unable to send password reset email at this time. Please try again later or contact administrator.');
    error.statusCode = 500;
    error.code = 'EMAIL_SEND_FAILED';
    throw error;
  }

  console.log('[FORGOT PASSWORD] Reset email successfully dispatched.');
  return genericResponse;
};

export const resetPassword = async (token, newPassword) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    const error = new Error('This password reset link is invalid or has expired.');
    error.statusCode = 400;
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpire');

  if (!user) {
    const error = new Error('This password reset link is invalid or has expired.');
    error.statusCode = 400;
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  // Update password (pre-save hook hashes with bcrypt automatically) (Requirement 14, 42)
  user.password = newPassword;

  // Single-use: invalidate reset token immediately (Requirement 15, 47)
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return {
    success: true,
    message: 'Password reset successful! You may now log in with your new password.',
  };
};
