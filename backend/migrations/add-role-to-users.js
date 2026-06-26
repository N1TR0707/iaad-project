const db = require('../config/database');
const bcrypt = require('bcrypt');

async function migrateUsersTable() {
  try {
    console.log('Starting user table migration...');

    // Step 1: Add role column to users table
    try {
      await db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
      console.log('✓ Added role column to users table');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ Role column already exists');
      } else {
        throw err;
      }
    }

    // Step 2: Migrate admins to users table
    console.log('Migrating admins to users table...');
    const admins = await db.all('SELECT * FROM admins');
    
    for (const admin of admins) {
      try {
        // Check if admin already exists in users
        const existing = await db.get('SELECT id FROM users WHERE email = ?', [admin.username]);
        
        if (!existing) {
          await db.run(
            'INSERT INTO users (email, password_hash, nama, role, created_at) VALUES (?, ?, ?, ?, ?)',
            [admin.username, admin.password_hash, admin.username, 'admin', admin.created_at]
          );
          console.log(`✓ Migrated admin: ${admin.username}`);
        } else {
          // Update existing user to admin
          await db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', admin.username]);
          console.log(`✓ Updated existing user to admin: ${admin.username}`);
        }
      } catch (err) {
        console.log(`⚠ Warning migrating ${admin.username}:`, err.message);
      }
    }

    console.log('\n=================================');
    console.log('Migration completed successfully!');
    console.log('=================================');
    console.log('\nNow all users (including admins) are in users table');
    console.log('Admin accounts have role="admin"');
    console.log('Regular users have role="user"');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUsersTable();
