import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', '..', 'bank.db');

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for safety and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      pin_hash TEXT,
      pan_number TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT DEFAULT 'savings',
      currency TEXT DEFAULT 'INR',
      balance REAL DEFAULT 0.00,
      status TEXT DEFAULT 'active',
      ifsc_code TEXT DEFAULT 'APEX0001021',
      branch_name TEXT DEFAULT 'Connaught Place, New Delhi',
      upi_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id TEXT UNIQUE NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      counterparty_account TEXT,
      counterparty_name TEXT,
      transfer_mode TEXT DEFAULT 'IMPS',
      description TEXT,
      category TEXT DEFAULT 'General',
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      card_number TEXT UNIQUE NOT NULL,
      card_holder TEXT NOT NULL,
      card_type TEXT DEFAULT 'debit',
      brand TEXT DEFAULT 'RuPay',
      expiry_month INTEGER NOT NULL,
      expiry_year INTEGER NOT NULL,
      cvv TEXT NOT NULL,
      is_frozen INTEGER DEFAULT 0,
      daily_limit REAL DEFAULT 50000.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      ifsc_code TEXT DEFAULT 'APEX0001021',
      bank_name TEXT DEFAULT 'Apex Bank',
      upi_id TEXT,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      term_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      monthly_emi REAL NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fixed_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      principal_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      maturity_amount REAL NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      maturity_date DATETIME NOT NULL,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ACID-compliant transaction helper
export function executeTransaction(callback) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
