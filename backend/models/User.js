const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(email, password, nama, telepon) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password_hash, nama, telepon) VALUES (?, ?, ?, ?)',
      [email, passwordHash, nama, telepon]
    );
    return result.id;
  }

  static async findByEmail(email) {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  }

  static async getAll() {
    return await db.all('SELECT id, email, nama, telepon, role, created_at FROM users ORDER BY created_at DESC');
  }

  static async getStats() {
    const result = await db.get('SELECT COUNT(*) as total FROM users');
    return result.total;
  }

  static async delete(id) {
    // First delete all activations (peripherals) for this user
    await db.run('DELETE FROM activations WHERE user_id = ?', [id]);
    
    // Then delete the user
    return await db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  static async update(id, { nama, email, role }) {
    await db.run(
      'UPDATE users SET nama = ?, email = ?, role = ? WHERE id = ?',
      [nama, email, role, id]
    );
    return await this.findById(id);
  }
}

module.exports = User;
