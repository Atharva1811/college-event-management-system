import express from 'express';
import * as authController from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerValidator, authController.register);
router.post('/apply-organizer', authController.applyOrganizer);
router.post('/apply-admin', authController.applyAdmin);
router.post('/apply-organizer-upgrade', protect, authController.applyOrganizerUpgrade);
router.post('/login', loginValidator, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

export default router;
