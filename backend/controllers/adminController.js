const Activation = require('../models/Activation');
const SerialNumber = require('../models/SerialNumber');
const Product = require('../models/Product');
const User = require('../models/User');
const WarrantyClaim = require('../models/WarrantyClaim');
const SerialGenerator = require('../services/serialGenerator');
const { sanitizeInput } = require('../utils/validators');

// Generate serial numbers in batch
exports.generateSerials = async (req, res) => {
  try {
    const { productId, count } = req.body;

    if (!productId || !count) {
      return res.status(400).json({ error: 'Product ID dan jumlah wajib diisi' });
    }

    const quantity = parseInt(count);
    if (isNaN(quantity) || quantity < 1 || quantity > 1000) {
      return res.status(400).json({ error: 'Jumlah harus antara 1-1000' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Generate serials
    const serials = await SerialGenerator.generateBatch(productId, quantity);

    res.status(201).json({
      message: `Berhasil generate ${serials.length} serial numbers`,
      product: product.nama,
      count: serials.length,
      serials: serials
    });
  } catch (error) {
    console.error('Generate serials error:', error);
    res.status(500).json({ error: 'Gagal generate serial numbers' });
  }
};

// Get all activations with pagination
exports.getAllActivations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const activations = await Activation.getAll(limit, offset);

    // Add warranty status
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
      page,
      limit,
      total: activationsWithStatus.length,
      activations: activationsWithStatus
    });
  } catch (error) {
    console.error('Get all activations error:', error);
    res.status(500).json({ error: 'Gagal mengambil data aktivasi' });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [activationStats, serialStats, totalUsers, totalProducts, monthlyStats, claimStats] = await Promise.all([
      Activation.getStats(),
      SerialNumber.getStats(),
      User.getStats(),
      Product.getStats(),
      Activation.getMonthlyStats(),
      WarrantyClaim.getStats()
    ]);

    res.json({
      activations: activationStats,
      serials: serialStats,
      users: totalUsers,
      products: totalProducts,
      monthly_activations: monthlyStats,
      claims: claimStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { nama, kategori, durasiGaransiBulan, deskripsi } = req.body;

    if (!nama || !kategori || !durasiGaransiBulan) {
      return res.status(400).json({ error: 'Nama, kategori, dan durasi garansi wajib diisi' });
    }

    const durasi = parseInt(durasiGaransiBulan);
    if (isNaN(durasi) || durasi < 1) {
      return res.status(400).json({ error: 'Durasi garansi harus minimal 1 bulan' });
    }

    const sanitizedNama = sanitizeInput(nama);
    const sanitizedKategori = sanitizeInput(kategori);
    const sanitizedDeskripsi = deskripsi ? sanitizeInput(deskripsi) : '';

    const productId = await Product.create(
      sanitizedNama,
      sanitizedKategori,
      durasi,
      sanitizedDeskripsi
    );

    res.status(201).json({
      message: 'Produk berhasil ditambahkan',
      product: {
        id: productId,
        nama: sanitizedNama,
        kategori: sanitizedKategori,
        durasi_garansi_bulan: durasi
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kategori, durasiGaransiBulan, deskripsi } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const durasi = parseInt(durasiGaransiBulan);
    if (isNaN(durasi) || durasi < 1) {
      return res.status(400).json({ error: 'Durasi garansi harus minimal 1 bulan' });
    }

    await Product.update(
      id,
      sanitizeInput(nama),
      sanitizeInput(kategori),
      durasi,
      deskripsi ? sanitizeInput(deskripsi) : ''
    );

    res.json({ message: 'Produk berhasil diupdate' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Gagal update produk' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Check if product has serials
    const serials = await SerialNumber.getByProduct(id);
    if (serials.length > 0) {
      return res.status(409).json({ 
        error: 'Tidak dapat menghapus produk yang memiliki serial numbers' 
      });
    }

    await Product.delete(id);
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
};

// Get all serial numbers for a product
exports.getProductSerials = async (req, res) => {
  try {
    const { productId } = req.params;
    const status = req.query.status; // 'available' or 'used'

    const serials = await SerialNumber.getByProduct(productId, status);

    res.json({
      product_id: productId,
      status: status || 'all',
      total: serials.length,
      serials
    });
  } catch (error) {
    console.error('Get product serials error:', error);
    res.status(500).json({ error: 'Gagal mengambil serial numbers' });
  }
};

// Export activations to CSV
exports.exportActivations = async (req, res) => {
  try {
    const activations = await Activation.getAll(10000, 0); // Get up to 10000 records

    // Create CSV content
    const headers = 'ID,User,Email,Product,Serial Code,Activated At,Warranty Expired At,Status\n';
    const rows = activations.map(a => {
      const expiredAt = new Date(a.warranty_expired_at);
      const isExpired = expiredAt < new Date();
      const status = isExpired ? 'Expired' : 'Active';
      
      return `${a.id},"${a.user_nama}","${a.email}","${a.product_nama}","${a.serial_code}","${a.activated_at}","${a.warranty_expired_at}","${status}"`;
    }).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activations.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export activations error:', error);
    res.status(500).json({ error: 'Gagal export data' });
  }
};

// Export serial numbers to CSV
exports.exportSerials = async (req, res) => {
  try {
    const { productId } = req.params;
    const serials = await SerialNumber.getByProduct(productId);

    // Create CSV content
    const headers = 'Serial Code,Product,Status,Generated At,Activated At\n';
    const rows = serials.map(s => {
      return `"${s.serial_code}","${s.product_nama || ''}","${s.status}","${s.generated_at}","${s.activated_at || ''}"`;
    }).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=serials-product-${productId}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export serials error:', error);
    res.status(500).json({ error: 'Gagal export serial numbers' });
  }
};

// Get all serial numbers with pagination and filters
exports.getAllSerials = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const serials = await SerialNumber.getAllWithProduct(limit, offset);
    
    res.json({
      total: serials.length,
      serials
    });
  } catch (error) {
    console.error('Get all serials error:', error);
    res.status(500).json({ error: 'Gagal mengambil data serial numbers' });
  }
};

// Delete serial number
exports.deleteSerial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if serial exists
    const serial = await SerialNumber.findById(id);
    if (!serial) {
      return res.status(404).json({ error: 'Serial number tidak ditemukan' });
    }
    
    // Check if serial has been used
    if (serial.status === 'used') {
      return res.status(400).json({ error: 'Serial number sudah digunakan, tidak bisa dihapus' });
    }
    
    await SerialNumber.delete(id);
    
    res.json({ message: 'Serial number berhasil dihapus' });
  } catch (error) {
    console.error('Delete serial error:', error);
    res.status(500).json({ error: 'Gagal menghapus serial number' });
  }
};

// Update serial number status
exports.updateSerialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['available', 'used'].includes(status)) {
      return res.status(400).json({ error: 'Status harus "available" atau "used"' });
    }
    
    // Check if serial exists
    const serial = await SerialNumber.findById(id);
    if (!serial) {
      return res.status(404).json({ error: 'Serial number tidak ditemukan' });
    }
    
    await SerialNumber.updateStatus(id, status);
    
    res.json({ 
      message: 'Status serial number berhasil diupdate',
      status 
    });
  } catch (error) {
    console.error('Update serial status error:', error);
    res.status(500).json({ error: 'Gagal update status serial number' });
  }
};

// Get all warranty claims (admin)
exports.getAllClaims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    const claims = await WarrantyClaim.getAll(limit, offset, status);

    res.json({
      page,
      limit,
      total: claims.length,
      claims
    });
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({ error: 'Gagal mengambil data klaim' });
  }
};

// Get claim by ID (admin)
exports.getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await WarrantyClaim.findById(id);

    if (!claim) {
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }

    res.json({ claim });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ error: 'Gagal mengambil data klaim' });
  }
};

// Update claim status (admin)
exports.updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, returnTrackingNumber, returnCourierName } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status wajib diisi' });
    }

    const validStatuses = ['pending', 'awaiting_shipment', 'item_shipped', 'item_received', 'in_progress', 'return_shipped', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    // Check if claim exists
    const claim = await WarrantyClaim.findById(id);
    if (!claim) {
      return res.status(404).json({ error: 'Klaim tidak ditemukan' });
    }

    const sanitizedNotes = adminNotes ? sanitizeInput(adminNotes) : null;
    const sanitizedReturnTracking = returnTrackingNumber ? sanitizeInput(returnTrackingNumber) : null;
    const sanitizedReturnCourier = returnCourierName ? sanitizeInput(returnCourierName) : null;

    await WarrantyClaim.updateStatus(id, status, sanitizedNotes, sanitizedReturnTracking, sanitizedReturnCourier);

    res.json({ 
      message: 'Status klaim berhasil diupdate',
      status,
      adminNotes: sanitizedNotes,
      returnTrackingNumber: sanitizedReturnTracking,
      returnCourierName: sanitizedReturnCourier
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({ error: 'Gagal update status klaim' });
  }
};

// Export claims to CSV
exports.exportClaims = async (req, res) => {
  try {
    const claims = await WarrantyClaim.getAll(10000, 0);

    const headers = 'ID,User,Email,Product,Serial Code,Issue,Status,Reported At,Admin Notes\n';
    const rows = claims.map(c => {
      return `${c.id},"${c.user_nama}","${c.user_email}","${c.product_nama}","${c.serial_code}","${c.issue_description}","${c.status}","${c.reported_at}","${c.admin_notes || ''}"`;
    }).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=warranty-claims.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export claims error:', error);
    res.status(500).json({ error: 'Gagal export data klaim' });
  }
};
