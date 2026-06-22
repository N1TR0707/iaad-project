const db = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
  static async create(username, password, role = 'admin') {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return result.id;
  }

  static async findByUsername(username) {
    return await db.get('SELECT * FROM admins WHERE username = ?', [username]);
  }

  static async findById(id) {
    return await db.get('SELECT * FROM admins WHERE id = ?', [id]);
  }

  static async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  static async updatePassword(adminId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return await db.run(
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [passwordHash, adminId]
    );
  }
}

module.exports = Admin;
