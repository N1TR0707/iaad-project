const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token for users
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== 'user') {
        return res.status(403).json({ error: 'Invalid token type' });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        nama: user.nama
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to verify JWT token for admins
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const admin = await Admin.findById(decoded.adminId);
      
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }

      req.admin = {
        id: admin.id,
        username: admin.username,
        role: admin.role
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to verify JWT token for admins (supports query parameter for exports)
const authenticateAdminExport = async (req, res, next) => {
  try {
    // Check query parameter first (for export links)
    let token = req.query.token;
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const admin = await Admin.findById(decoded.adminId);
      
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }

      req.admin = {
        id: admin.id,
        username: admin.username,
        role: admin.role
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  authenticateAdminExport,
  generateToken
};
