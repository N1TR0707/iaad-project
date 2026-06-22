const db = require('./database');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nama TEXT NOT NULL,
        telepon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admins table
    await db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        kategori TEXT,
        durasi_garansi_bulan INTEGER NOT NULL DEFAULT 12,
        deskripsi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create serial_numbers table
    await db.run(`
      CREATE TABLE IF NOT EXISTS serial_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_code TEXT UNIQUE NOT NULL,
        product_id INTEGER NOT NULL,
        status TEXT DEFAULT 'available',
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        activated_at DATETIME,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create activations table
    await db.run(`
      CREATE TABLE IF NOT EXISTS activations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        serial_number_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        warranty_expired_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create email_logs table
    await db.run(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent'
      )
    `);

    // Create warranty_claims table
    await db.run(`
      CREATE TABLE IF NOT EXISTS warranty_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        issue_description TEXT NOT NULL,
        photo_path TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        tracking_number TEXT,
        courier_name TEXT,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (activation_id) REFERENCES activations(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create indexes for performance
    await db.run('CREATE INDEX IF NOT EXISTS idx_serial_code ON serial_numbers(serial_code)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_user_activations ON activations(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_warranty_expired ON activations(warranty_expired_at)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_email_recipient ON email_logs(recipient)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_claim_user ON warranty_claims(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_claim_status ON warranty_claims(status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_claim_activation ON warranty_claims(activation_id)');
    console.log('Database schema created successfully!');

    // Insert sample data
    console.log('Inserting sample data...');

    // Create default admin account (username: admin, password: admin123)
    const adminPassword = await bcrypt.hash('admin123', 10);
    try {
      await db.run(
        'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', adminPassword, 'admin']
      );
      console.log('✓ Default admin created (username: admin, password: admin123)');
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        console.log('✓ Admin account already exists');
      }
    }

    // Insert sample products
    const sampleProducts = [
      { nama: 'Smartphone X1', kategori: 'Elektronik', durasi: 12, deskripsi: 'Smartphone premium dengan garansi 1 tahun' },
      { nama: 'Laptop Pro 15', kategori: 'Komputer', durasi: 24, deskripsi: 'Laptop profesional dengan garansi 2 tahun' },
      { nama: 'Smart TV 55"', kategori: 'Elektronik', durasi: 12, deskripsi: 'Smart TV 4K dengan garansi 1 tahun' },
      { nama: 'Kulkas 2 Pintu', kategori: 'Elektronik Rumah', durasi: 36, deskripsi: 'Kulkas hemat energi dengan garansi 3 tahun' }
    ];

    for (const product of sampleProducts) {
      try {
        await db.run(
          'INSERT INTO products (nama, kategori, durasi_garansi_bulan, deskripsi) VALUES (?, ?, ?, ?)',
          [product.nama, product.kategori, product.durasi, product.deskripsi]
        );
        console.log(`✓ Product added: ${product.nama}`);
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          console.log(`✓ Product already exists: ${product.nama}`);
        }
      }
    }

    console.log('\n=================================');
    console.log('Database initialization complete!');
    console.log('=================================');
    console.log('\nDefault Admin Login:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nPlease change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
