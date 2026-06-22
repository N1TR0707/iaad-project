const db = require('../config/database');

class SerialNumber {
  static async create(serialCode, productId) {
    const result = await db.run(
      'INSERT INTO serial_numbers (serial_code, product_id, status) VALUES (?, ?, ?)',
      [serialCode, productId, 'available']
    );
    return result.id;
  }

  static async findByCode(serialCode) {
    return await db.get(
      `SELECT sn.*, p.nama as product_nama, p.durasi_garansi_bulan 
       FROM serial_numbers sn 
       LEFT JOIN products p ON sn.product_id = p.id 
       WHERE sn.serial_code = ?`,
      [serialCode]
    );
  }

  static async markAsUsed(serialCode) {
    return await db.run(
      'UPDATE serial_numbers SET status = ?, activated_at = CURRENT_TIMESTAMP WHERE serial_code = ?',
      ['used', serialCode]
    );
  }

  static async getByProduct(productId, status = null) {
    if (status) {
      return await db.all(
        'SELECT * FROM serial_numbers WHERE product_id = ? AND status = ? ORDER BY generated_at DESC',
        [productId, status]
      );
    }
    return await db.all(
      'SELECT * FROM serial_numbers WHERE product_id = ? ORDER BY generated_at DESC',
      [productId]
    );
  }

  static async getStats() {
    const total = await db.get('SELECT COUNT(*) as count FROM serial_numbers');
    const available = await db.get("SELECT COUNT(*) as count FROM serial_numbers WHERE status = 'available'");
    const used = await db.get("SELECT COUNT(*) as count FROM serial_numbers WHERE status = 'used'");
    
    return {
      total: total.count,
      available: available.count,
      used: used.count
    };
  }

  static async getAllWithProduct(limit = 100, offset = 0) {
    return await db.all(
      `SELECT sn.*, p.nama as product_nama, p.kategori 
       FROM serial_numbers sn 
       LEFT JOIN products p ON sn.product_id = p.id 
       ORDER BY sn.generated_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  static async findById(id) {
    return await db.get(
      `SELECT sn.*, p.nama as product_nama, p.kategori
       FROM serial_numbers sn
       LEFT JOIN products p ON sn.product_id = p.id
       WHERE sn.id = ?`,
      [id]
    );
  }

  static async delete(id) {
    return await db.run('DELETE FROM serial_numbers WHERE id = ?', [id]);
  }

  static async updateStatus(id, status) {
    return await db.run(
      'UPDATE serial_numbers SET status = ? WHERE id = ?',
      [status, id]
    );
  }
}

module.exports = SerialNumber;
