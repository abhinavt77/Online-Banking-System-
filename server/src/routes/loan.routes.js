import { Router } from 'express';
import { db, executeTransaction } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function calculateEmi(principal, annualRate, months) {
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi * 100) / 100;
}

// GET /api/loans - User's loans
router.get('/', authenticateToken, (req, res) => {
  try {
    const loans = db.prepare(`
      SELECT l.*, a.account_number, a.ifsc_code 
      FROM loans l
      JOIN accounts a ON l.account_id = a.id
      WHERE l.user_id = ?
      ORDER BY l.id DESC
    `).all(req.user.id);

    return res.json({ loans });
  } catch (err) {
    console.error('Fetch loans error:', err);
    return res.status(500).json({ error: 'Failed to retrieve loans.' });
  }
});

// POST /api/loans - Apply for loan in INR
router.post('/', authenticateToken, (req, res) => {
  try {
    const { accountId, amount, termMonths, purpose } = req.body;
    const loanAmount = parseFloat(amount);
    const months = parseInt(termMonths, 10);

    if (!accountId || isNaN(loanAmount) || loanAmount < 25000 || loanAmount > 10000000 || isNaN(months) || months < 6 || !purpose) {
      return res.status(400).json({ error: 'Loan amount must be between ₹25,000 and ₹1,00,00,000, with a term of at least 6 months.' });
    }

    const account = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    // Dynamic rates: 12-24 mos: 8.25%, 36 mos: 8.75%, 48-60 mos: 9.5%
    const interestRate = months <= 24 ? 8.25 : months <= 36 ? 8.75 : 9.5;
    const monthlyEmi = calculateEmi(loanAmount, interestRate, months);

    const stmt = db.prepare(`
      INSERT INTO loans (user_id, account_id, amount, term_months, interest_rate, monthly_emi, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(req.user.id, account.id, loanAmount, months, interestRate, monthlyEmi, purpose.trim());

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'LOAN_APPLICATION', `Applied for ₹${loanAmount.toLocaleString('en-IN')} loan over ${months} months`);

    const createdLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'Loan application submitted successfully and is pending administrative review.',
      loan: createdLoan
    });
  } catch (err) {
    console.error('Apply loan error:', err);
    return res.status(500).json({ error: 'Failed to submit loan application.' });
  }
});

// GET /api/loans/fixed-deposits
router.get('/fixed-deposits', authenticateToken, (req, res) => {
  try {
    const fds = db.prepare(`
      SELECT f.*, a.account_number, a.ifsc_code 
      FROM fixed_deposits f
      JOIN accounts a ON f.account_id = a.id
      WHERE f.user_id = ?
      ORDER BY f.id DESC
    `).all(req.user.id);

    return res.json({ fixedDeposits: fds });
  } catch (err) {
    console.error('Fetch FDs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve fixed deposits.' });
  }
});

// POST /api/loans/fixed-deposits - Open new Fixed Deposit in INR
router.post('/fixed-deposits', authenticateToken, (req, res) => {
  try {
    const { accountId, amount, tenureMonths } = req.body;
    const principal = parseFloat(amount);
    const months = parseInt(tenureMonths, 10);

    if (!accountId || isNaN(principal) || principal < 5000 || isNaN(months) || months < 3) {
      return res.status(400).json({ error: 'Minimum Fixed Deposit is ₹5,000 for at least 3 months.' });
    }

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Funding account not found.' });
    }
    if (account.balance < principal) {
      return res.status(400).json({ error: `Insufficient balance (₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).` });
    }

    // Indian FD rates: 3-6 mos: 6.0%, 7-12 mos: 7.5%, 13+ mos: 8.25%
    const rate = months <= 6 ? 6.0 : months <= 12 ? 7.5 : 8.25;
    const interest = principal * (rate / 100) * (months / 12);
    const maturityAmount = Math.round((principal + interest) * 100) / 100;

    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + months);

    const fdResult = executeTransaction((txnDb) => {
      // Debit funding account
      const newBal = Math.round((account.balance - principal) * 100) / 100;
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBal, account.id);

      // Record transaction
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'transfer_out', ?, ?, 'INTERNAL-FD', 'Apex Term Fixed Deposit', 'INTERNAL', 'Fixed Deposit Booking (INR)', 'Investment', 'completed')
      `).run(`TXN-IN-FD-${Date.now()}`, account.id, principal, newBal);

      // Insert FD record
      const stmt = txnDb.prepare(`
        INSERT INTO fixed_deposits (user_id, account_id, principal_amount, interest_rate, tenure_months, maturity_amount, start_date, maturity_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);
      const res = stmt.run(req.user.id, account.id, principal, rate, months, maturityAmount, startDate.toISOString().split('T')[0], maturityDate.toISOString().split('T')[0]);
      return txnDb.prepare('SELECT * FROM fixed_deposits WHERE id = ?').get(res.lastInsertRowid);
    });

    return res.status(201).json({
      message: `Fixed Deposit of ₹${principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} created at ${rate}% annual interest!`,
      fixedDeposit: fdResult
    });
  } catch (err) {
    console.error('Create FD error:', err);
    return res.status(500).json({ error: 'Failed to create fixed deposit.' });
  }
});

export default router;
