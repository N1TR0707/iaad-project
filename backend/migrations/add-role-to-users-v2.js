const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Starting user table migration...');

const dbPath = path.resolve(__dirname, '../database.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

db.serialize(() => {
  // Check if role column exists
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err.message);
      db.close();
      process.exit(1);
    }

    const hasRole = columns.some(col => col.name === 'role');

    if (hasRole) {
      console.log('Role column already exists');
      db.close();
      return;
    }

    console.log('Adding role column to users table...');

    // Add role column
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
      if (err) {
        console.error('Error adding role column:', err.message);
        db.close();
        process.exit(1);
      }

      console.log('Role column added successfully');

      // Update existing users to have 'user' role
      db.run(`UPDATE users SET role = 'user' WHERE role IS NULL`, (err) => {
        if (err) {
          console.error('Error updating users:', err.message);
        } else {
          console.log('Updated existing users with default role');
        }

        db.close();
        console.log('Migration completed successfully');
      });
    });
  });
});
