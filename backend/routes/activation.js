const express = require('express');
const router = express.Router();
const activationController = require('../controllers/activationController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { activationLimiter } = require('../middleware/rateLimiter');

// Protected routes (require authentication)
router.post('/activate', authenticateUser, activationLimiter, activationController.activateProduct);
router.get('/my-activations', authenticateUser, activationController.getUserActivations);

// Public routes (no authentication required)
router.get('/check-warranty', activationController.checkWarrantyStatus);

module.exports = router;
