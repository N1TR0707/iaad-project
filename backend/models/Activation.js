const db = require('../config/database');

class Activation {
  static async create(userId, serialNumberId, productId, warrantyExpiredAt) {
    const result = await db.run(
      'INSERT INTO activations (user_id, serial_number_id, product_id, warranty_expired_at) VALUES (?, ?, ?, ?)',
      [userId, serialNumberId, productId, warrantyExpiredAt]
    );
    return result.id;
  }

  static async findByUserId(userId) {
    return await db.all(
      `SELECT a.*, 
              u.email, u.nama, 
              p.nama as product_nama, p.kategori,
              sn.serial_code
       FROM activations a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN products p ON a.product_id = p.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE a.user_id = ?
       ORDER BY a.activated_at DESC`,
      [userId]
    );
  }

  static async findBySerialCode(serialCode) {
    return await db.get(
      `SELECT a.*, 
              u.email, u.nama, u.telepon,
              p.nama as product_nama, p.kategori, p.durasi_garansi_bulan,
              sn.serial_code
       FROM activations a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN products p ON a.product_id = p.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE sn.serial_code = ?`,
      [serialCode]
    );
  }

  static async getAll(limit = 100, offset = 0) {
    return await db.all(
      `SELECT a.*, 
              u.email, u.nama as user_nama,
              p.nama as product_nama, p.kategori,
              sn.serial_code
       FROM activations a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN products p ON a.product_id = p.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       ORDER BY a.activated_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  static async getStats() {
    const total = await db.get('SELECT COUNT(*) as count FROM activations');
    const active = await db.get(
      'SELECT COUNT(*) as count FROM activations WHERE warranty_expired_at > CURRENT_TIMESTAMP'
    );
    const expired = await db.get(
      'SELECT COUNT(*) as count FROM activations WHERE warranty_expired_at <= CURRENT_TIMESTAMP'
    );
    
    return {
      total: total.count,
      active: active.count,
      expired: expired.count
    };
  }

  static async getExpiringWarranties(days) {
    return await db.all(
      `SELECT a.*, 
              u.email, u.nama,
              p.nama as product_nama,
              sn.serial_code
       FROM activations a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN products p ON a.product_id = p.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE DATE(a.warranty_expired_at) = DATE('now', '+' || ? || ' days')`,
      [days]
    );
  }

  static async getMonthlyStats() {
    return await db.all(
      `SELECT 
         strftime('%Y-%m', activated_at) as month,
         COUNT(*) as count
       FROM activations
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    );
  }
}

module.exports = Activation;
