import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isConnected } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error: JWT_SECRET is missing.',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!isConnected()) {
        // DB not connected, but token is valid - pass decoded user payload
        req.user = {
          _id: decoded.id,
          role: decoded.role,
          name: decoded.name || 'User',
          email: decoded.email,
        };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.',
        });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administrator.',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided.',
    });
  }
};
