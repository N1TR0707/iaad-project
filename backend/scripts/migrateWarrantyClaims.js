const db = require('../config/database');

async function migrate() {
  console.log('🔧 Migrating warranty_claims table...');

  const alterQueries = [
    { 
      name: 'user_tracking_number',
      query: `ALTER TABLE warranty_claims ADD COLUMN user_tracking_number TEXT` 
    },
    { 
      name: 'user_courier_name',
      query: `ALTER TABLE warranty_claims ADD COLUMN user_courier_name TEXT` 
    },
    { 
      name: 'return_tracking_number',
      query: `ALTER TABLE warranty_claims ADD COLUMN return_tracking_number TEXT` 
    },
    { 
      name: 'return_courier_name',
      query: `ALTER TABLE warranty_claims ADD COLUMN return_courier_name TEXT` 
    },
    { 
      name: 'item_received_at',
      query: `ALTER TABLE warranty_claims ADD COLUMN item_received_at DATETIME` 
    },
    { 
      name: 'return_shipped_at',
      query: `ALTER TABLE warranty_claims ADD COLUMN return_shipped_at DATETIME` 
    }
  ];

  for (const { name, query } of alterQueries) {
    try {
      await db.run(query);
      console.log(`✅ Added column: ${name}`);
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log(`⏭️  Column already exists: ${name}`);
      } else {
        console.error(`❌ Error adding column ${name}:`, err.message);
        throw err;
      }
    }
  }

  // Migrate existing tracking_number to return_tracking_number
  try {
    await db.run(`
      UPDATE warranty_claims 
      SET return_tracking_number = tracking_number,
          return_courier_name = courier_name
      WHERE tracking_number IS NOT NULL
    `);
    console.log('✅ Migrated existing tracking numbers to return tracking');
  } catch (err) {
    console.error('⚠️  Error migrating existing data:', err.message);
  }

  console.log('\n=================================');
  console.log('✅ Migration completed successfully!');
  console.log('=================================\n');
  console.log('New columns added:');
  console.log('  - user_tracking_number');
  console.log('  - user_courier_name');
  console.log('  - return_tracking_number');
  console.log('  - return_courier_name');
  console.log('  - item_received_at');
  console.log('  - return_shipped_at\n');
  console.log('New status values available:');
  console.log('  - pending');
  console.log('  - item_shipped');
  console.log('  - item_received');
  console.log('  - in_progress');
  console.log('  - return_shipped');
  console.log('  - completed');
  console.log('  - rejected\n');
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
