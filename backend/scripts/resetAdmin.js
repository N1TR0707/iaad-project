const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

async function resetAdminPassword() {
  const dbPath = path.join(__dirname, '..', 'database.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('🔄 Resetting admin password...');
    
    // Hash password baru
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password user admin
    db.run(
      'UPDATE users SET password_hash = ? WHERE email = ? OR role = ?',
      [hashedPassword, 'admin@iaad.store', 'admin'],
      function(err) {
        if (err) {
          console.error('❌ Error:', err.message);
          db.close();
          return;
        }
        
        if (this.changes > 0) {
          console.log('✅ Password admin berhasil direset!');
          console.log('📝 Username: admin');
          console.log('📝 Password: admin123');
          console.log('');
          console.log('⚠️  JANGAN LUPA ubah password setelah login!');
          db.close();
        } else {
          console.log('❌ User admin tidak ditemukan!');
          console.log('🔄 Membuat user admin baru...');
          
          // Buat user admin baru
          db.run(
            'INSERT INTO users (email, password_hash, nama, telepon, role, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
            ['admin@iaad.store', hashedPassword, 'Administrator', '', 'admin'],
            function(err) {
              if (err) {
                console.error('❌ Error:', err.message);
              } else {
                console.log('✅ User admin baru berhasil dibuat!');
                console.log('📝 Username: admin');
                console.log('📝 Password: admin123');
              }
              db.close();
            }
          );
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
  }
}

resetAdminPassword();
