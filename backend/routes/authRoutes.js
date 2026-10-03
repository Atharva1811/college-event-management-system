import express from 'express';
import * as authController from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', protect, authController.getMe);

export default router;
