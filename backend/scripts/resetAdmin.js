const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetAdminPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aktivasi_db'
  });

  try {
    console.log('🔄 Resetting admin password...');
    
    // Hash password baru
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password user admin
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE username = ? OR role = ?',
      [hashedPassword, 'admin', 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Password admin berhasil direset!');
      console.log('📝 Username: admin');
      console.log('📝 Password: admin123');
      console.log('');
      console.log('⚠️  JANGAN LUPA ubah password setelah login!');
    } else {
      console.log('❌ User admin tidak ditemukan!');
      console.log('🔄 Membuat user admin baru...');
      
      // Buat user admin baru
      await connection.execute(
        'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['admin', 'admin@iaad.store', hashedPassword, 'admin']
      );
      
      console.log('✅ User admin baru berhasil dibuat!');
      console.log('📝 Username: admin');
      console.log('📝 Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();
