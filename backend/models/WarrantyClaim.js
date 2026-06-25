const db = require('../config/database');

class WarrantyClaim {
  static async create(activationId, userId, productId, issueDescription, photoPath = null, userTrackingNumber = null, userCourierName = null) {
    // Set initial status based on whether user provided tracking
    const initialStatus = userTrackingNumber ? 'item_shipped' : 'pending';
    
    const result = await db.run(
      `INSERT INTO warranty_claims 
       (activation_id, user_id, product_id, issue_description, photo_path, status, user_tracking_number, user_courier_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [activationId, userId, productId, issueDescription, photoPath, initialStatus, userTrackingNumber, userCourierName]
    );
    return result.id;
  }

  static async findById(id) {
    return await db.get(
      `SELECT wc.*, 
              u.nama as user_nama, u.email as user_email, u.telepon as user_telepon,
              p.nama as product_nama, p.kategori,
              sn.serial_code,
              a.warranty_expired_at
       FROM warranty_claims wc
       LEFT JOIN users u ON wc.user_id = u.id
       LEFT JOIN products p ON wc.product_id = p.id
       LEFT JOIN activations a ON wc.activation_id = a.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE wc.id = ?`,
      [id]
    );
  }

  static async findByUserId(userId) {
    return await db.all(
      `SELECT wc.*, 
              p.nama as product_nama, p.kategori,
              sn.serial_code,
              a.warranty_expired_at
       FROM warranty_claims wc
       LEFT JOIN products p ON wc.product_id = p.id
       LEFT JOIN activations a ON wc.activation_id = a.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE wc.user_id = ?
       ORDER BY wc.reported_at DESC`,
      [userId]
    );
  }

  static async getAll(limit = 100, offset = 0, status = null) {
    let query = `
      SELECT wc.*, 
             u.nama as user_nama, u.email as user_email, u.telepon as user_telepon,
             p.nama as product_nama, p.kategori,
             sn.serial_code,
             a.warranty_expired_at
      FROM warranty_claims wc
      LEFT JOIN users u ON wc.user_id = u.id
      LEFT JOIN products p ON wc.product_id = p.id
      LEFT JOIN activations a ON wc.activation_id = a.id
      LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
    `;

    const params = [];
    
    if (status) {
      query += ' WHERE wc.status = ?';
      params.push(status);
    }

    query += ' ORDER BY wc.reported_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.all(query, params);
  }

  static async updateStatus(id, status, adminNotes = null, returnTrackingNumber = null, returnCourierName = null) {
    const params = [status];
    let query = 'UPDATE warranty_claims SET status = ?';

    if (adminNotes) {
      query += ', admin_notes = ?';
      params.push(adminNotes);
    }

    if (returnTrackingNumber) {
      query += ', return_tracking_number = ?';
      params.push(returnTrackingNumber);
    }

    if (returnCourierName) {
      query += ', return_courier_name = ?';
      params.push(returnCourierName);
    }

    // Auto-set timestamps based on status
    if (status === 'item_received') {
      query += ', item_received_at = CURRENT_TIMESTAMP';
    }

    if (status === 'return_shipped') {
      query += ', return_shipped_at = CURRENT_TIMESTAMP';
    }

    if (status === 'completed' || status === 'rejected') {
      query += ', resolved_at = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ?';
    params.push(id);

    return await db.run(query, params);
  }

  static async getStats() {
    const total = await db.get('SELECT COUNT(*) as count FROM warranty_claims');
    const pending = await db.get("SELECT COUNT(*) as count FROM warranty_claims WHERE status = 'pending'");
    const inProgress = await db.get("SELECT COUNT(*) as count FROM warranty_claims WHERE status = 'in_progress'");
    const completed = await db.get("SELECT COUNT(*) as count FROM warranty_claims WHERE status = 'completed'");
    const rejected = await db.get("SELECT COUNT(*) as count FROM warranty_claims WHERE status = 'rejected'");

    return {
      total: total.count,
      pending: pending.count,
      in_progress: inProgress.count,
      completed: completed.count,
      rejected: rejected.count
    };
  }

  static async findByActivationId(activationId) {
    return await db.all(
      `SELECT wc.*, 
              p.nama as product_nama,
              sn.serial_code
       FROM warranty_claims wc
       LEFT JOIN products p ON wc.product_id = p.id
       LEFT JOIN activations a ON wc.activation_id = a.id
       LEFT JOIN serial_numbers sn ON a.serial_number_id = sn.id
       WHERE wc.activation_id = ?
       ORDER BY wc.reported_at DESC`,
      [activationId]
    );
  }
}

module.exports = WarrantyClaim;
