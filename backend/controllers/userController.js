import User from '../models/User.js';
import { isConnected } from '../config/db.js';
import { assertCanDeleteOrganizer, handleOrganizerDeletion } from '../utils/eventRules.js';
import { createNotification } from '../services/notificationService.js';
import { sendAdminApplicationApprovedEmail, sendAdminApplicationDeniedEmail } from '../services/emailService.js';

export const getUsers = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { role, department, search, page = 1, limit = 10, isActive, organizerStatus, adminStatus } = req.query;
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

    if (organizerStatus && organizerStatus !== 'All') {
      filter.organizerStatus = organizerStatus;
    }

    if (adminStatus && adminStatus !== 'All') {
      filter.adminStatus = adminStatus;
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
        message: 'Database is not connected. Please verify MongoDB connection.',
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
        message: 'Database is not connected. Please verify MongoDB connection.',
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
        code: 'FORBIDDEN',
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

export const updateOrganizerStatus = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can review organizer applications.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { status } = req.body;
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "denied".',
      });
    }

    user.organizerStatus = status;
    user.isActive = status === 'approved';

    await user.save();

    // Send notification to the organizer applicant
    if (status === 'approved') {
      await createNotification({
        recipient: user._id,
        type: 'application_approved',
        title: 'Organizer Application Approved',
        message: 'Congratulations! Your faculty organizer application has been approved. You can now log in and manage campus events.',
      });
    } else {
      await createNotification({
        recipient: user._id,
        type: 'application_denied',
        title: 'Organizer Application Update',
        message: 'Your faculty organizer application has been reviewed and denied by the administration.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Organizer application has been ${status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminApplications = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can view admin applications.',
      });
    }

    if (req.user.status === 'suspended' || !req.user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: req.user.suspensionReason || 'Your account has been suspended by the administrator.',
      });
    }

    const { status = 'all', search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.adminStatus = status;
    } else {
      filter.adminStatus = { $in: ['pending', 'approved', 'denied'] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total, pendingCount, approvedCount, deniedCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('adminProcessedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
      User.countDocuments({ adminStatus: 'pending' }),
      User.countDocuments({ adminStatus: 'approved' }),
      User.countDocuments({ adminStatus: 'denied' }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Admin applications retrieved successfully',
      data: {
        applications,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          denied: deniedCount,
          total: pendingCount + approvedCount + deniedCount,
        },
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminStatus = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can review admin applications.',
      });
    }

    if (req.user.status === 'suspended' || !req.user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: req.user.suspensionReason || 'Your account has been suspended by the administrator.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Application / User not found.',
      });
    }

    // Self-approval protection (Requirement 27)
    if (req.user._id && user._id && req.user._id.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Administrators cannot review or approve their own application.',
      });
    }

    const { status, reason } = req.body;
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "denied".',
      });
    }

    // Check if application was already processed (Requirement 15)
    if (user.adminStatus === 'approved') {
      return res.status(409).json({
        success: false,
        code: 'APPLICATION_ALREADY_PROCESSED',
        message: 'This administrator application has already been approved.',
      });
    }
    if (user.adminStatus === 'denied') {
      return res.status(409).json({
        success: false,
        code: 'APPLICATION_ALREADY_PROCESSED',
        message: 'This administrator application has already been denied.',
      });
    }
    if (user.adminStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_APPLICATION_STATE',
        message: 'This user does not have an active pending administrator application.',
      });
    }

    user.adminStatus = status;
    user.adminProcessedBy = req.user._id;
    user.adminProcessedAt = new Date();

    if (status === 'approved') {
      user.role = 'admin';
      user.isActive = true;
      user.status = 'active';
    } else {
      user.adminDenialReason = (reason || '').trim();
    }

    await user.save();

    // In-app Notification (Requirement 18)
    await createNotification({
      recipient: user._id,
      type: status === 'approved' ? 'admin_approved' : 'admin_denied',
      title: status === 'approved' ? 'Admin Access Granted' : 'Admin Application Update',
      message:
        status === 'approved'
          ? 'Your Admin application has been approved. You can now log in and access the Admin Dashboard.'
          : `Your Admin application has been denied.${reason ? ` Reason: ${reason}` : ''}`,
    });

    // Brevo Transactional Email Notification (Requirement 19)
    try {
      if (status === 'approved') {
        await sendAdminApplicationApprovedEmail({ to: user.email, name: user.name });
      } else {
        await sendAdminApplicationDeniedEmail({ to: user.email, name: user.name, reason });
      }
    } catch (emailErr) {
      console.warn('[AdminApproval] Email notification skipped or failed:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Admin application has been ${status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can suspend accounts.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protection 1: Admin cannot suspend themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account.',
      });
    }

    // Protection 2: Cannot suspend the last active administrator
    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        status: { $ne: 'suspended' },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot suspend the last active system administrator.',
        });
      }
    }

    const { reason } = req.body;
    user.status = 'suspended';
    user.isActive = false;
    user.suspensionReason = reason || 'Your account has been suspended by the administrator.';
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;

    await user.save();

    await createNotification({
      recipient: user._id,
      type: 'account_suspended',
      title: 'Account Suspended',
      message: user.suspensionReason,
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.name} has been suspended.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const reactivateUser = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is temporarily unavailable.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can reactivate accounts.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.status = 'active';
    user.isActive = true;
    user.suspensionReason = '';
    user.suspendedAt = null;
    user.suspendedBy = null;

    await user.save();

    await createNotification({
      recipient: user._id,
      type: 'account_reactivated',
      title: 'Account Reactivated',
      message: 'Your account has been reactivated by the administrator. You may now log in.',
    });

    res.status(200).json({
      success: true,
      message: `Account for ${user.name} has been reactivated.`,
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
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: Only administrators can delete user accounts.',
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

    // Protection: Cannot delete the last active administrator
    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: true,
        status: { $ne: 'suspended' },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last active system administrator.',
        });
      }
    }

    // Requirements 23-27: Organizer ongoing event block & upcoming event reassignment
    if (user.role === 'organizer') {
      await handleOrganizerDeletion(user);
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
