const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/uploadMiddleware');

// All routes require user authentication
router.use(authenticateUser);

// Submit warranty claim (with optional multiple photos/videos upload)
router.post('/submit', apiLimiter, upload.array('photos', 5), claimController.submitClaim);

// Get user's claims
router.get('/my-claims', claimController.getMyClaims);

// Get specific claim by ID
router.get('/:id', claimController.getClaimById);

module.exports = router;
