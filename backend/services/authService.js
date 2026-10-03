import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
    },
    token,
  };
};
