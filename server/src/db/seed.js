import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';

export function seedDatabase(force = false) {
  initDatabase();

  if (force) {
    console.log('Force re-seeding database for Indian Banking System (INR)...');
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM fixed_deposits;
      DELETE FROM loans;
      DELETE FROM transactions;
      DELETE FROM cards;
      DELETE FROM beneficiaries;
      DELETE FROM accounts;
      DELETE FROM users;
    `);
  } else {
    const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (existing) {
      console.log('Database already initialized.');
      return;
    }
  }

  console.log('Seeding fresh Indian Online Banking Database with Rupee (INR) accounts...');

  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const pinHash = bcrypt.hashSync('1234', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, phone, role, pin_hash, pan_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run(
    'Chief Branch Manager',
    'admin@apexbank.com',
    adminPasswordHash,
    '+91 98110 54321',
    'admin',
    pinHash,
    'APEXB1029K',
    'active'
  );

  const aaravResult = insertUser.run(
    'Aarav Sharma',
    'aarav@example.com',
    passwordHash,
    '+91 98201 44552',
    'customer',
    pinHash,
    'ABCPS4821N',
    'active'
  );

  const priyaResult = insertUser.run(
    'Priya Patel',
    'priya@example.com',
    passwordHash,
    '+91 98765 12340',
    'customer',
    pinHash,
    'BPQPP1190K',
    'active'
  );

  const rohanResult = insertUser.run(
    'Rohan Gupta',
    'rohan@example.com',
    passwordHash,
    '+91 97110 88219',
    'customer',
    pinHash,
    'CGPRG9941M',
    'active'
  );

  const aaravId = Number(aaravResult.lastInsertRowid);
  const priyaId = Number(priyaResult.lastInsertRowid);
  const rohanId = Number(rohanResult.lastInsertRowid);

  // 2. Insert Accounts with IFSC and UPI IDs
  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, ifsc_code, branch_name, upi_id)
    VALUES (?, ?, ?, 'INR', ?, 'active', 'APEX0001021', 'Connaught Place, New Delhi', ?)
  `);

  const aaravSalary = insertAccount.run(aaravId, '501004928172', 'salary', 145800.00, 'aarav@apexbank');
  const aaravSavings = insertAccount.run(aaravId, '501004928173', 'savings', 850000.00, 'aarav.savings@apexbank');
  const priyaSavings = insertAccount.run(priyaId, '501008821944', 'savings', 84500.00, 'priya@okhdfcbank');
  const rohanSalary = insertAccount.run(rohanId, '501007733190', 'salary', 120000.00, 'rohan@oksbi');

  const aaravSalaryId = Number(aaravSalary.lastInsertRowid);
  const aaravSavingsId = Number(aaravSavings.lastInsertRowid);

  // 3. Insert RuPay & Visa Cards for Aarav
  const insertCard = db.prepare(`
    INSERT INTO cards (user_id, account_id, card_number, card_holder, card_type, brand, expiry_month, expiry_year, cvv, is_frozen, daily_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCard.run(aaravId, aaravSalaryId, '6071881920394412', 'AARAV SHARMA', 'debit', 'RuPay', 10, 2029, '729', 0, 75000.00);
  insertCard.run(aaravId, aaravSalaryId, '4532752093845519', 'AARAV SHARMA', 'credit', 'Visa', 12, 2030, '418', 0, 250000.00);

  // 4. Insert Beneficiaries for Aarav
  const insertBeneficiary = db.prepare(`
    INSERT INTO beneficiaries (user_id, name, account_number, ifsc_code, bank_name, upi_id, nickname)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertBeneficiary.run(aaravId, 'Priya Patel', '501008821944', 'APEX0001021', 'Apex Bank', 'priya@okhdfcbank', 'Priya (Sister)');
  insertBeneficiary.run(aaravId, 'Rohan Gupta', '501007733190', 'APEX0001021', 'Apex Bank', 'rohan@oksbi', 'Rohan (Roommate)');
  insertBeneficiary.run(aaravId, 'Ananya Verma', '501006611228', 'HDFC0001244', 'HDFC Bank', 'ananya@upi', 'Ananya (Landlord)');

  // 5. Insert Realistic Indian Transactions
  const insertTxn = db.prepare(`
    INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const txns = [
    ['TXN-IN-9081-01', aaravSalaryId, 'deposit', 125000.00, 145800.00, 'SALARY-INFOSYS', 'Infosys Ltd Payroll', 'NEFT', 'Monthly Salary Credit', 'Salary', 'completed', '2026-10-15 10:15:00'],
    ['TXN-IN-9081-02', aaravSalaryId, 'transfer_out', 28000.00, 20800.00, '501006611228', 'Ananya Verma', 'IMPS', 'Apartment Monthly Rent', 'Housing', 'completed', '2026-10-14 16:30:00'],
    ['TXN-IN-9081-03', aaravSalaryId, 'bill_payment', 3450.00, 48800.00, 'BESCOM-99381', 'BESCOM Bangalore Electricity', 'UPI', 'Electricity Utility Bill', 'Utilities', 'completed', '2026-10-12 19:20:00'],
    ['TXN-IN-9081-04', aaravSalaryId, 'withdrawal', 5000.00, 52250.00, 'ATM-DEL-04', 'Apex Connaught Place ATM', 'ATM', 'Cash Withdrawal', 'Cash', 'completed', '2026-10-10 12:45:00'],
    ['TXN-IN-9081-05', aaravSalaryId, 'transfer_in', 4500.00, 57250.00, '501008821944', 'Priya Patel', 'UPI', 'Split Goa Vacation Hotel Booking', 'Transfer', 'completed', '2026-10-08 21:10:00'],
    ['TXN-IN-9081-06', aaravSalaryId, 'bill_payment', 1199.00, 52750.00, 'JIOFIB-88412', 'Reliance JioFiber Gigabit', 'BBPS', 'Broadband Internet Bill', 'Utilities', 'completed', '2026-10-05 11:00:00'],
    ['TXN-IN-9081-07', aaravSavingsId, 'deposit', 250000.00, 850000.00, 'INTERNAL-TRF', 'Apex High Yield Savings', 'IMPS', 'Festival Bonus Savings Transfer', 'Investment', 'completed', '2026-09-30 18:00:00'],
  ];

  for (const t of txns) {
    insertTxn.run(...t);
  }

  // 6. Loans & Fixed Deposits in INR
  const insertLoan = db.prepare(`
    INSERT INTO loans (user_id, account_id, amount, term_months, interest_rate, monthly_emi, purpose, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLoan.run(aaravId, aaravSalaryId, 850000.00, 48, 8.25, 20845.50, 'Tata Nexon EV Electric Vehicle Loan', 'approved', '2026-08-15 11:00:00');
  insertLoan.run(priyaId, Number(priyaSavings.lastInsertRowid), 350000.00, 24, 9.50, 16084.20, 'Higher Studies & Tech Certification', 'pending', '2026-10-16 14:20:00');

  const insertFD = db.prepare(`
    INSERT INTO fixed_deposits (user_id, account_id, principal_amount, interest_rate, tenure_months, maturity_amount, start_date, maturity_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFD.run(aaravId, aaravSavingsId, 200000.00, 7.50, 12, 215000.00, '2026-01-15', '2027-01-15', 'active');

  console.log('✅ Indian Banking System seeding successfully completed!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(true);
}
