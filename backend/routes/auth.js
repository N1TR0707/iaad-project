const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// User routes
router.post('/register', registerLimiter, authController.registerUser);
router.post('/login', loginLimiter, authController.loginUser);
router.get('/profile', authenticateUser, authController.getUserProfile);

// Admin routes
router.post('/admin/login', loginLimiter, authController.loginAdmin);

module.exports = router;
