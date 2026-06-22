const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/authMiddleware');
const { validateEmail, validatePassword, sanitizeInput, validatePhone } = require('../utils/validators');
const emailService = require('../services/emailService');

// User Registration
exports.registerUser = async (req, res) => {
  try {
    const { email, password, nama, telepon } = req.body;

    // Validate input
    if (!email || !password || !nama) {
      return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    if (telepon && !validatePhone(telepon)) {
      return res.status(400).json({ error: 'Format nomor telepon tidak valid' });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedNama = sanitizeInput(nama);
    const sanitizedTelepon = telepon ? sanitizeInput(telepon) : null;

    // Check if user already exists
    const existingUser = await User.findByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    // Create user
    const userId = await User.create(sanitizedEmail, password, sanitizedNama, sanitizedTelepon);

    // Send welcome email
    await emailService.sendWelcomeEmail(sanitizedEmail, sanitizedNama);

    // Generate token
    const token = generateToken({ userId, type: 'user' });

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        id: userId,
        email: sanitizedEmail,
        nama: sanitizedNama
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Find user
    const user = await User.findByEmail(sanitizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, type: 'user' });

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        telepon: user.telepon
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const sanitizedUsername = sanitizeInput(username);

    // Find admin
    const admin = await Admin.findByUsername(sanitizedUsername);
    if (!admin) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Verify password
    const isValidPassword = await Admin.verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Generate token
    const token = generateToken({ adminId: admin.id, type: 'admin' });

    res.json({
      message: 'Login admin berhasil',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
};

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      id: user.id,
      email: user.email,
      nama: user.nama,
      telepon: user.telepon,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Gagal mengambil data profil' });
  }
};
