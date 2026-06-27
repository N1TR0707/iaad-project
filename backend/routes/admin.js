const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, authenticateAdminExport } = require('../middleware/authMiddleware');
const { serialGenerationLimiter } = require('../middleware/rateLimiter');

// Export routes with query token support (must be before router.use)
router.get('/activations/export', authenticateAdminExport, adminController.exportActivations);
router.get('/serials/export/:productId', authenticateAdminExport, adminController.exportSerials);
router.get('/claims/export', authenticateAdminExport, adminController.exportClaims);

// All other admin routes require admin authentication
router.use(authenticateAdmin);

// Dashboard & Statistics
router.get('/stats', adminController.getDashboardStats);

// Product Management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Serial Number Management
router.post('/serials/generate', serialGenerationLimiter, adminController.generateSerials);
router.get('/serials', adminController.getAllSerials);
router.get('/serials/product/:productId', adminController.getProductSerials);
router.delete('/serials/:id', adminController.deleteSerial);
router.put('/serials/:id/status', adminController.updateSerialStatus);

// Activation Management
router.get('/activations', adminController.getAllActivations);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Warranty Claims Management
router.get('/claims', adminController.getAllClaims);
router.get('/claims/:id', adminController.getClaimById);
router.put('/claims/:id/status', adminController.updateClaimStatus);

module.exports = router;
