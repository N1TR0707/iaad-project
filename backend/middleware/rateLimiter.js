const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts (max 5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate limiter for registration (max 3 registrations per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Terlalu banyak registrasi. Coba lagi dalam 1 jam.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate limiter for activation (max 5 activations per day per IP)
const activationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: { error: 'Terlalu banyak percobaan aktivasi. Coba lagi besok.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate limiter for serial generation (admin only, max 50 generations per hour)
const serialGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: 'Terlalu banyak generate serial. Coba lagi dalam 1 jam.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// General API rate limiter (max 100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  activationLimiter,
  serialGenerationLimiter,
  apiLimiter
};
