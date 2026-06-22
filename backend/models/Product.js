const db = require('../config/database');

class Product {
  static async create(nama, kategori, durasiGaransiBulan, deskripsi = '') {
    const result = await db.run(
      'INSERT INTO products (nama, kategori, durasi_garansi_bulan, deskripsi) VALUES (?, ?, ?, ?)',
      [nama, kategori, durasiGaransiBulan, deskripsi]
    );
    return result.id;
  }

  static async findById(id) {
    return await db.get('SELECT * FROM products WHERE id = ?', [id]);
  }

  static async getAll() {
    return await db.all('SELECT * FROM products ORDER BY created_at DESC');
  }

  static async update(id, nama, kategori, durasiGaransiBulan, deskripsi) {
    return await db.run(
      'UPDATE products SET nama = ?, kategori = ?, durasi_garansi_bulan = ?, deskripsi = ? WHERE id = ?',
      [nama, kategori, durasiGaransiBulan, deskripsi, id]
    );
  }

  static async delete(id) {
    return await db.run('DELETE FROM products WHERE id = ?', [id]);
  }

  static async getStats() {
    const result = await db.get('SELECT COUNT(*) as total FROM products');
    return result.total;
  }
}

module.exports = Product;
