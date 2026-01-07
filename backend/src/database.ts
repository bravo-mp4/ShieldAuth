import { Pool, PoolConfig } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('Connecting to database...');

// Create pool with optimized settings for Railway + Supabase
const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  min: 2,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
  allowExitOnIdle: false,
};

export const pool = new Pool(poolConfig);

// Connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

// Test connection with retries
async function testConnection(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query('SELECT NOW() as time, version() as version');
      console.log('✓ Database connected:', result.rows[0].time);
      console.log('✓ PostgreSQL version:', result.rows[0].version.split(',')[0]);
      await runInitialMigrations();
      return;
    } catch (err: any) {
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        const delay = (i + 1) * 5000;
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All database connection attempts failed');
        console.error('Please check your DATABASE_URL environment variable');
        console.error('Current connection string host:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
      }
    }
  }
}

testConnection();

// Run initial migrations
async function runInitialMigrations() {
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!result.rows[0].exists) {
      console.log('Running initial database setup...');
      const fs = require('fs');
      const path = require('path');
      
      // Run init.sql
      const initSQL = fs.readFileSync(path.join(__dirname, '../migrations/init.sql'), 'utf8');
      await pool.query(initSQL);
      console.log('✓ Database tables created');
      
      // Run seed.sql
      const seedSQL = fs.readFileSync(path.join(__dirname, '../migrations/seed.sql'), 'utf8');
      await pool.query(seedSQL);
      console.log('✓ Initial data seeded');
    } else {
      console.log('Database already initialized');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// --- User Authentication Functions ---

export async function createUser(email: string, password: string, name?: string) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role, created_at',
      [email.toLowerCase().trim(), passwordHash, name?.trim() || null]
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('User with this email already exists');
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email is required');
  }
  
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// --- License System Functions ---

export async function getLicense(licenseKey: string) {
  const result = await pool.query(
    "SELECT * FROM licenses WHERE license_key = $1",
    [licenseKey]
  );
  return result.rows[0];
}

export async function getHWIDs(licenseKey: string) {
  const result = await pool.query(
    "SELECT hwid_hash FROM hwid_slots WHERE license_key = $1",
    [licenseKey]
  );
  return result.rows.map((row) => row.hwid_hash);
}

export async function bindHWID(licenseKey: string, hwid: string) {
  await pool.query(
    "INSERT INTO hwid_slots (license_key, hwid_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [licenseKey, hwid]
  );
}

export async function createSession(
  sessionId: string,
  licenseKey: string,
  hwid: string
) {
  await pool.query(
    "INSERT INTO sessions (session_id, license_key, hwid_hash) VALUES ($1, $2, $3)",
    [sessionId, licenseKey, hwid]
  );
}
