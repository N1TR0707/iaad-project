const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const activationRoutes = require('./routes/activation');
const adminRoutes = require('./routes/admin');
const claimRoutes = require('./routes/claim');
const { apiLimiter } = require('./middleware/rateLimiter');
const CronService = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/claim', claimRoutes);

// Serve static files (frontend)
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploaded files

// Root endpoint - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'IAAD-PROJECT - Warranty Management System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        adminLogin: 'POST /api/auth/admin/login'
      },
      activation: {
        activate: 'POST /api/activation/activate',
        myActivations: 'GET /api/activation/my-activations',
        checkWarranty: 'GET /api/activation/check-warranty?serialCode=XXX'
      },
      admin: {
        stats: 'GET /api/admin/stats',
        products: 'GET /api/admin/products',
        generateSerials: 'POST /api/admin/serials/generate',
        activations: 'GET /api/admin/activations',
        users: 'GET /api/admin/users'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('🚀 Server is running!');
  console.log('=================================');
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================\n');

  // Start cron jobs
  CronService.startAllJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
