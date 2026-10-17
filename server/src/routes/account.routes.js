import { Router } from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function generateAccountNumber() {
  const prefix = '5010';
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  return prefix + random8;
}

// GET /api/accounts - List user's accounts
router.get('/', authenticateToken, (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT * FROM accounts 
      WHERE user_id = ? 
      ORDER BY id ASC
    `).all(req.user.id);

    return res.json({ accounts });
  } catch (err) {
    console.error('Fetch accounts error:', err);
    return res.status(500).json({ error: 'Failed to retrieve accounts.' });
  }
});

// GET /api/accounts/lookup/:identifier - Verify recipient by Account Number OR UPI ID
router.get('/lookup/:identifier', authenticateToken, (req, res) => {
  try {
    const rawId = req.params.identifier.trim();
    const isUpi = rawId.includes('@');

    let query = `
      SELECT a.id, a.account_number, a.account_type, a.status, a.ifsc_code, a.branch_name, a.upi_id, u.full_name
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE ${isUpi ? 'a.upi_id = ?' : 'a.account_number = ?'}
    `;

    const account = db.prepare(query).get(isUpi ? rawId.toLowerCase() : rawId);

    if (!account) {
      return res.status(404).json({ error: isUpi ? 'UPI ID not registered.' : 'Bank Account number not found.' });
    }

    if (account.status === 'frozen') {
      return res.status(400).json({ error: 'This destination account is currently frozen.' });
    }

    return res.json({
      accountNumber: account.account_number,
      accountType: account.account_type,
      recipientName: account.full_name,
      ifscCode: account.ifsc_code,
      branchName: account.branch_name,
      upiId: account.upi_id
    });
  } catch (err) {
    console.error('Account lookup error:', err);
    return res.status(500).json({ error: 'Failed to look up recipient.' });
  }
});

// GET /api/accounts/:id - Account details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const account = db.prepare(`
      SELECT * FROM accounts 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'Account not found or access denied.' });
    }

    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE account_id = ? 
      ORDER BY created_at DESC 
      LIMIT 25
    `).all(account.id);

    return res.json({ account, transactions });
  } catch (err) {
    console.error('Fetch account detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve account details.' });
  }
});

// POST /api/accounts - Open a new account (e.g. Fixed Deposit Linked / Secondary Savings)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { accountType, initialDeposit } = req.body;
    const type = accountType === 'salary' ? 'salary' : 'savings';
    const deposit = parseFloat(initialDeposit) || 0;

    if (deposit < 0) {
      return res.status(400).json({ error: 'Initial funding deposit cannot be negative.' });
    }

    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
    const newAccNumber = generateAccountNumber();
    const upiUsername = user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.' + type + Math.floor(10 + Math.random() * 90);
    const upiId = `${upiUsername}@apexbank`;

    const insertStmt = db.prepare(`
      INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, ifsc_code, branch_name, upi_id)
      VALUES (?, ?, ?, 'INR', ?, 'active', 'APEX0001021', 'Connaught Place, New Delhi', ?)
    `);
    const result = insertStmt.run(req.user.id, newAccNumber, type, deposit, upiId);
    const newAccountId = Number(result.lastInsertRowid);

    if (deposit > 0) {
      db.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'deposit', ?, ?, 'INTERNAL', 'Initial Account Opening', 'NEFT', 'Initial deposit on account creation', 'Salary', 'completed')
      `).run(`TXN-IN-NEW-${Date.now()}`, newAccountId, deposit, deposit);
    }

    const createdAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(newAccountId);
    return res.status(201).json({ message: 'New Indian bank account created successfully!', account: createdAccount });
  } catch (err) {
    console.error('Create account error:', err);
    return res.status(500).json({ error: 'Failed to create new account.' });
  }
});

export default router;
