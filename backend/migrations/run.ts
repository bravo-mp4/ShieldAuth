import { pool } from '../src/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Run init.sql
    const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('✓ init.sql executed');
    
    // Run seed.sql
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seedSQL);
    console.log('✓ seed.sql executed');
    
    console.log('All migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
