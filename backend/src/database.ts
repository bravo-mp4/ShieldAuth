import { Pool, PoolConfig } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('Initializing database connection...');

// Try connectionString first, if it fails use parsed URL
let poolConfig: PoolConfig;

try {
  // For Railway + external databases, use direct connectionString
  poolConfig = {
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : {
      rejectUnauthorized: false,
      // Force TLS 1.2+ for better compatibility
      minVersion: 'TLSv1.2'
    },
    max: 5, // Reduced pool size for Railway
    min: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 20000,
    query_timeout: 10000,
    statement_timeout: 10000,
  };
} catch (err) {
  console.error('Failed to create pool config:', err);
  throw err;
}

export const pool = new Pool(poolConfig);

// Connection error handling
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

pool.on('connect', (client) => {
  console.log('✓ Database client connected');
});

pool.on('remove', () => {
  console.log('Database client removed from pool');
});

// Test connection with aggressive retries
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

async function testConnection(): Promise<void> {
  connectionAttempts++;
  
  try {
    console.log(`\n[Attempt ${connectionAttempts}/${MAX_ATTEMPTS}] Testing database connection...`);
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time, version() as version, inet_server_addr() as server_ip');
      console.log('✓ Connected at:', result.rows[0].time);
      console.log('✓ PostgreSQL:', result.rows[0].version.split(',')[0]);
      console.log('✓ Server IP:', result.rows[0].server_ip || 'N/A');
      
      await runInitialMigrations();
      console.log('✓ Database ready\n');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error(`❌ Connection attempt ${connectionAttempts} failed:`, err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err.errno);
    
    if (err.code === 'ENETUNREACH' || err.code === 'ETIMEDOUT') {
      console.error('\n🔥 NETWORK ERROR: Railway cannot reach your database server');
      console.error('This is an IPv6 routing issue between Railway and your database provider');
      console.error('\nSOLUTION: Switch to a Railway-compatible database:');
      console.error('  1. Railway PostgreSQL (native support)');
      console.error('  2. Neon.tech (works with Railway)');
      console.error('  3. Supabase via Prisma Data Proxy');
    }
    
    if (connectionAttempts < MAX_ATTEMPTS) {
      const delay = Math.min(5000 * connectionAttempts, 30000);
      console.log(`Retrying in ${delay/1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return testConnection();
    } else {
      console.error('\n❌ All connection attempts exhausted');
      console.error('Please check RAILWAY_SETUP.md for solutions\n');
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
