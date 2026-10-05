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

      if (!req.user.isActive || req.user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: req.user.suspensionReason || 'Your account has been suspended by the administrator.',
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

export const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (isConnected()) {
          const user = await User.findById(decoded.id).select('-password');
          if (user && user.isActive && user.status !== 'suspended') {
            req.user = user;
          }
        } else {
          req.user = {
            _id: decoded.id,
            role: decoded.role,
            name: decoded.name || 'User',
            email: decoded.email,
            department: decoded.department,
          };
        }
      }
    } catch {
      // Token invalid or expired - proceed as unauthenticated without failing
    }
  }

  next();
};
