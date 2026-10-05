import express from 'express';
import * as locationController from '../controllers/locationController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// List locations (supports optional authorization for scoped views)
router.get('/', optionalProtect, locationController.getLocations);
router.get('/:id', optionalProtect, locationController.getLocation);

// Protected routes
router.use(protect);

// Create location (Admin activates directly; Organizer creates pending request)
router.post('/', authorize('admin', 'organizer'), locationController.createLocation);

// Admin-only location management
router.put('/:id', authorize('admin'), locationController.updateLocation);
router.patch('/:id/status', authorize('admin'), locationController.updateLocationStatus);
router.patch('/:id/deactivate', authorize('admin'), locationController.deactivateLocation);

export default router;
