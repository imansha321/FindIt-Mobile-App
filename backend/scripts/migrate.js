const { query } = require('../config/database');

const createTables = async () => {
  try {
    console.log('🚀 Starting database migration...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        stripe_account_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create items table
    await query(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('lost', 'found', 'bounty')),
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        reward_amount DECIMAL(10, 2),
        images TEXT[],
        is_priority BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active',
        payment_status VARCHAR(20) DEFAULT 'pending',
        payout_status VARCHAR(20) DEFAULT 'pending',
        payout_amount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Items table created');

    // Create payments table
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) NOT NULL,
        stripe_payment_intent_id VARCHAR(255) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Payments table created');

    // Create payouts table
    await query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID PRIMARY KEY,
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        finder_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        stripe_transfer_id VARCHAR(255) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Payouts table created');

    // Create reports table
    await query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY,
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL CHECK (action IN ('found', 'claimed')),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Reports table created');

    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        read_status BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Notifications table created');

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at)');
    
    await query('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_payments_item_id ON payments(item_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
    
    await query('CREATE INDEX IF NOT EXISTS idx_reports_item_id ON reports(item_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id)');
    
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status)');
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)');

    console.log('✅ Database indexes created');

    // Insert sample data for testing
    await insertSampleData();

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  try {
    console.log('📝 Inserting sample data...');

    // Insert sample users
    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+1-555-0123'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+1-555-0456'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+1-555-0789'
      }
    ];

    for (const user of users) {
      await query(
        `INSERT INTO users (id, name, email, password, phone) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.name, user.email, user.password, user.phone]
      );
    }

    // Insert sample items
    const items = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Lost Wallet',
        description: 'Black leather wallet with brown stitching. Contains driver\'s license, credit cards, and some cash. Lost near Central Park entrance on 5th Avenue.',
        category: 'Accessories',
        item_type: 'lost',
        location: 'Central Park, 5th Avenue Entrance',
        is_priority: true
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Found Keys',
        description: 'Set of car keys with a red keychain. Found near the library entrance. Keys appear to be for a Toyota vehicle.',
        category: 'Keys',
        item_type: 'found',
        location: 'City Library, Main Entrance'
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Bounty: Lost Dog',
        description: 'Brown Labrador named Max, wearing a blue collar. Very friendly and responds to his name. Last seen near Green Park area.',
        category: 'Pets',
        item_type: 'bounty',
        location: 'Green Park Area',
        reward_amount: 100,
        is_priority: true
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'iPhone 13',
        description: 'Blue iPhone 13 lost at the subway station.',
        category: 'Electronics',
        item_type: 'lost',
        location: 'Subway Station'
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Found Backpack',
        description: 'Blue backpack found at the bus stop.',
        category: 'Bags',
        item_type: 'found',
        location: 'Main Bus Stop',
        is_priority: true
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Bounty: Missing Laptop',
        description: 'Silver MacBook Pro, $200 bounty for information.',
        category: 'Electronics',
        item_type: 'bounty',
        location: 'Tech Hub',
        reward_amount: 200
      }
    ];

    for (const item of items) {
      await query(
        `INSERT INTO items (id, user_id, title, description, category, item_type, location, reward_amount, is_priority) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id, item.user_id, item.title, item.description, 
          item.category, item.item_type, item.location, 
          item.reward_amount || null, item.is_priority || false
        ]
      );
    }

    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  const { connectDB } = require('../config/database');
  
  const runMigration = async () => {
    try {
      await connectDB();
      await createTables();
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  };

  runMigration();
}

module.exports = { createTables, insertSampleData }; 