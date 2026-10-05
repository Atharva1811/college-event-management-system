import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/organizer-status', authorize('admin'), userController.updateOrganizerStatus);
router.patch('/:id/admin-status', authorize('admin'), userController.updateAdminStatus);
router.patch('/:id/suspend', authorize('admin'), userController.suspendUser);
router.patch('/:id/reactivate', authorize('admin'), userController.reactivateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

export default router;
