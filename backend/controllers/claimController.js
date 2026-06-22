const WarrantyClaim = require('../models/WarrantyClaim');
const Activation = require('../models/Activation');
const { sanitizeInput } = require('../utils/validators');

// Submit warranty claim (user)
exports.submitClaim = async (req, res) => {
  try {
    const { activationId, issueDescription } = req.body;
    const userId = req.user.id;
    
    // Handle multiple files (photos/videos)
    const mediaPaths = req.files && req.files.length > 0 
      ? req.files.map(file => `/uploads/claims/${file.filename}`).join(',')
      : null;

    if (!activationId || !issueDescription) {
      return res.status(400).json({ error: 'Activation ID dan deskripsi masalah wajib diisi' });
    }

    const sanitizedDescription = sanitizeInput(issueDescription);

    // Verify activation belongs to user
    const activations = await Activation.findByUserId(userId);
    const activation = activations.find(a => a.id === parseInt(activationId));

    if (!activation) {
      return res.status(404).json({ error: 'Aktivasi tidak ditemukan' });
    }

    // Check if warranty is still active
    const now = new Date();
    const expiredAt = new Date(activation.warranty_expired_at);
    if (expiredAt < now) {
      return res.status(400).json({ error: 'Garansi sudah expired, tidak bisa mengajukan klaim' });
    }

    // Create claim
    const claimId = await WarrantyClaim.create(
      activationId,
      userId,
      activation.product_id,
      sanitizedDescription,
      mediaPaths
    );

    res.status(201).json({
      message: 'Klaim garansi berhasil diajukan',
      claim: {
        id: claimId,
        activation_id: activationId,
        issue_description: sanitizedDescription,
        media_paths: mediaPaths,
        files_count: req.files ? req.files.length : 0,
        status: 'pending',
        reported_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengajukan klaim' });
  }
};

// Get user's warranty claims
exports.getMyClaims = async (req, res) => {
  try {
    const userId = req.user.id;
    const claims = await WarrantyClaim.findByUserId(userId);

    res.json({
      total: claims.length,
      claims
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Gagal mengambil data klaim' });
  }
};

// Get claim by ID (user can only access their own)
exports.getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const claim = await WarrantyClaim.findById(id);

    if (!claim) {
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }

    if (claim.user_id !== userId) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    res.json({ claim });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ error: 'Gagal mengambil data klaim' });
  }
};
