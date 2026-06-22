const Activation = require('../models/Activation');
const SerialNumber = require('../models/SerialNumber');
const Product = require('../models/Product');
const SerialGenerator = require('../services/serialGenerator');
const emailService = require('../services/emailService');
const { sanitizeInput } = require('../utils/validators');

// Activate product
exports.activateProduct = async (req, res) => {
  try {
    const { serialCode } = req.body;
    const userId = req.user.id;

    if (!serialCode) {
      return res.status(400).json({ error: 'Serial code wajib diisi' });
    }

    const sanitizedSerial = sanitizeInput(serialCode).toUpperCase();

    // Validate serial code format
    const validation = SerialGenerator.validateCode(sanitizedSerial);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check if serial exists
    const serial = await SerialNumber.findByCode(sanitizedSerial);
    if (!serial) {
      return res.status(404).json({ error: 'Serial code tidak ditemukan' });
    }

    // Check if already used
    if (serial.status === 'used') {
      return res.status(409).json({ error: 'Serial code sudah digunakan' });
    }

    // Get product details
    const product = await Product.findById(serial.product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Calculate warranty expiry date
    const warrantyExpiredAt = new Date();
    warrantyExpiredAt.setMonth(warrantyExpiredAt.getMonth() + product.durasi_garansi_bulan);

    // Create activation record
    const activationId = await Activation.create(
      userId,
      serial.id,
      product.id,
      warrantyExpiredAt.toISOString()
    );

    // Mark serial as used
    await SerialNumber.markAsUsed(sanitizedSerial);

    // Get user info for email
    const user = req.user;

    // Send activation success email
    await emailService.sendActivationSuccessEmail(
      user.email,
      user.nama,
      product.nama,
      sanitizedSerial,
      warrantyExpiredAt.toISOString()
    );

    // Send admin notification
    await emailService.sendAdminNotification(
      product.nama,
      user.nama,
      user.email,
      sanitizedSerial
    );

    res.status(201).json({
      message: 'Aktivasi berhasil',
      activation: {
        id: activationId,
        product_nama: product.nama,
        serial_code: sanitizedSerial,
        activated_at: new Date().toISOString(),
        warranty_expired_at: warrantyExpiredAt.toISOString(),
        durasi_garansi: product.durasi_garansi_bulan
      }
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat aktivasi' });
  }
};

// Get user's activations
exports.getUserActivations = async (req, res) => {
  try {
    const userId = req.user.id;
    const activations = await Activation.findByUserId(userId);

    // Add warranty status to each activation
    const now = new Date();
    const activationsWithStatus = activations.map(activation => {
      const expiredAt = new Date(activation.warranty_expired_at);
      const isExpired = expiredAt < now;
      const daysRemaining = Math.ceil((expiredAt - now) / (1000 * 60 * 60 * 24));

      return {
        ...activation,
        is_expired: isExpired,
        days_remaining: isExpired ? 0 : daysRemaining,
        status: isExpired ? 'expired' : 'active'
      };
    });

    res.json({
      total: activationsWithStatus.length,
      activations: activationsWithStatus
    });
  } catch (error) {
    console.error('Get activations error:', error);
    res.status(500).json({ error: 'Gagal mengambil data aktivasi' });
  }
};

// Check warranty status (public - no auth required)
exports.checkWarrantyStatus = async (req, res) => {
  try {
    const { serialCode } = req.query;

    if (!serialCode) {
      return res.status(400).json({ error: 'Serial code wajib diisi' });
    }

    const sanitizedSerial = sanitizeInput(serialCode).toUpperCase();

    // Find activation by serial code
    const activation = await Activation.findBySerialCode(sanitizedSerial);

    if (!activation) {
      return res.status(404).json({ 
        error: 'Serial code tidak ditemukan atau belum diaktivasi',
        found: false
      });
    }

    // Calculate warranty status
    const now = new Date();
    const expiredAt = new Date(activation.warranty_expired_at);
    const activatedAt = new Date(activation.activated_at);
    const isExpired = expiredAt < now;
    const daysRemaining = Math.ceil((expiredAt - now) / (1000 * 60 * 60 * 24));

    res.json({
      found: true,
      product: {
        nama: activation.product_nama,
        kategori: activation.kategori,
        durasi_garansi_bulan: activation.durasi_garansi_bulan
      },
      warranty: {
        serial_code: activation.serial_code,
        activated_at: activation.activated_at,
        expired_at: activation.warranty_expired_at,
        is_expired: isExpired,
        days_remaining: isExpired ? 0 : daysRemaining,
        status: isExpired ? 'expired' : 'active'
      },
      owner: {
        nama: activation.nama,
        email: activation.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for privacy
      }
    });
  } catch (error) {
    console.error('Check warranty error:', error);
    res.status(500).json({ error: 'Gagal mengecek status garansi' });
  }
};
