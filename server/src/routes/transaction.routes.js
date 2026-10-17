import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, executeTransaction } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function generateTxnRef(prefix = 'TXN-IN') {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ts}-${rand}`;
}

// POST /api/transactions/transfer - Indian Core Banking Transfer (IMPS / NEFT / RTGS / UPI)
router.post('/transfer', authenticateToken, (req, res) => {
  try {
    const { sourceAccountId, destinationAccountNumber, transferMode = 'IMPS', amount, description, pin } = req.body;
    const transferAmount = parseFloat(amount);
    const destIdentifier = destinationAccountNumber ? destinationAccountNumber.trim() : '';

    if (!sourceAccountId || !destIdentifier || isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Please provide valid source account, beneficiary account/UPI ID, and positive amount in INR.' });
    }

    // Verify User 4-digit Security PIN
    const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(req.user.id);
    if (user.pin_hash) {
      if (!pin) {
        return res.status(400).json({ error: '4-digit Transaction Security PIN is required.' });
      }
      const isPinValid = bcrypt.compareSync(pin, user.pin_hash);
      if (!isPinValid) {
        return res.status(403).json({ error: 'Incorrect 4-digit Security PIN.' });
      }
    }

    // Execute ACID atomic transaction
    const transferResult = executeTransaction((txnDb) => {
      // 1. Fetch source account
      const sourceAcc = txnDb.prepare(`
        SELECT a.*, u.full_name 
        FROM accounts a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.id = ? AND a.user_id = ?
      `).get(sourceAccountId, req.user.id);

      if (!sourceAcc) {
        throw new Error('Source account not found or unauthorized.');
      }
      if (sourceAcc.status === 'frozen') {
        throw new Error('Source account is currently frozen. Transfers are restricted.');
      }
      if (sourceAcc.balance < transferAmount) {
        throw new Error(`Insufficient balance. Available balance: ₹${sourceAcc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      }

      // 2. Fetch destination account (by account number OR UPI ID)
      const isUpi = destIdentifier.includes('@');
      const destAcc = txnDb.prepare(`
        SELECT a.*, u.full_name 
        FROM accounts a 
        JOIN users u ON a.user_id = u.id 
        WHERE ${isUpi ? 'LOWER(a.upi_id) = LOWER(?)' : 'a.account_number = ?'}
      `).get(destIdentifier);

      if (!destAcc) {
        throw new Error(isUpi ? 'Beneficiary UPI ID is not registered.' : 'Beneficiary Account Number does not exist.');
      }
      if (destAcc.status === 'frozen') {
        throw new Error('Beneficiary account is currently frozen and cannot receive funds.');
      }
      if (destAcc.id === sourceAcc.id) {
        throw new Error('Cannot transfer funds to the exact same account.');
      }

      // 3. Compute balances in INR
      const newSourceBalance = Math.round((sourceAcc.balance - transferAmount) * 100) / 100;
      const newDestBalance = Math.round((destAcc.balance + transferAmount) * 100) / 100;

      // 4. Update balances
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newSourceBalance, sourceAcc.id);
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newDestBalance, destAcc.id);

      // 5. Generate reference & record transactions
      const mode = transferMode.toUpperCase();
      const refId = generateTxnRef(`TXN-IN-${mode}`);
      const note = description ? description.trim() : `${mode} Fund Transfer`;

      // Debit Record for Sender
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'transfer_out', ?, ?, ?, ?, ?, ?, 'Transfer', 'completed')
      `).run(refId, sourceAcc.id, transferAmount, newSourceBalance, destAcc.account_number, destAcc.full_name, mode, note);

      // Credit Record for Recipient
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'transfer_in', ?, ?, ?, ?, ?, ?, 'Transfer', 'completed')
      `).run(`${refId}-CR`, destAcc.id, transferAmount, newDestBalance, sourceAcc.account_number, sourceAcc.full_name, mode, note);

      // Audit Log
      txnDb.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
        .run(req.user.id, 'TRANSFER_INR', `${mode} transferred ₹${transferAmount} from ${sourceAcc.account_number} to ${destAcc.account_number} (${destAcc.full_name})`);

      return {
        referenceId: refId,
        amount: transferAmount,
        newBalance: newSourceBalance,
        senderAccount: sourceAcc.account_number,
        recipientAccount: destAcc.account_number,
        recipientName: destAcc.full_name,
        recipientUpi: destAcc.upi_id,
        transferMode: mode,
        ifscCode: destAcc.ifsc_code,
        date: new Date().toISOString()
      };
    });

    return res.status(200).json({
      message: `${transferResult.transferMode} transfer completed successfully!`,
      transfer: transferResult
    });
  } catch (err) {
    console.error('Transfer execution error:', err.message);
    return res.status(400).json({ error: err.message || 'Transfer failed.' });
  }
});

// POST /api/transactions/deposit - Deposit INR funds
router.post('/deposit', authenticateToken, (req, res) => {
  try {
    const { accountId, amount, method, note } = req.body;
    const depositAmount = parseFloat(amount);

    if (!accountId || isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: 'Valid account and positive deposit amount required.' });
    }

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (account.status === 'frozen') {
      return res.status(400).json({ error: 'Account is frozen. Deposits unavailable.' });
    }

    const newBalance = Math.round((account.balance + depositAmount) * 100) / 100;
    const refId = generateTxnRef('TXN-IN-DEP');

    executeTransaction((txnDb) => {
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, account.id);
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'deposit', ?, ?, 'BANK-GATEWAY', ?, 'UPI/NEFT', ?, 'Salary', 'completed')
      `).run(refId, account.id, depositAmount, newBalance, method || 'UPI Infeed / Cash Deposit', note || 'Direct Deposit (INR)');
    });

    return res.json({
      message: 'Deposit successful in INR!',
      referenceId: refId,
      amount: depositAmount,
      newBalance
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ error: 'Deposit failed.' });
  }
});

// POST /api/transactions/withdraw - Withdraw cash via ATM
router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { accountId, amount, note } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!accountId || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Valid account and positive withdrawal amount required.' });
    }

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (account.status === 'frozen') {
      return res.status(400).json({ error: 'Account is frozen. Withdrawals unavailable.' });
    }
    if (account.balance < withdrawAmount) {
      return res.status(400).json({ error: `Insufficient funds. Balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` });
    }

    const newBalance = Math.round((account.balance - withdrawAmount) * 100) / 100;
    const refId = generateTxnRef('TXN-IN-ATM');

    executeTransaction((txnDb) => {
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, account.id);
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'withdrawal', ?, ?, 'ATM-NFS', 'National Financial Switch (NFS) ATM', 'ATM', ?, 'Cash', 'completed')
      `).run(refId, account.id, withdrawAmount, newBalance, note || 'ATM Cash Withdrawal');
    });

    return res.json({
      message: 'Cash withdrawal successful!',
      referenceId: refId,
      amount: withdrawAmount,
      newBalance
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    return res.status(500).json({ error: 'Withdrawal failed.' });
  }
});

// POST /api/transactions/bill-pay - Pay Indian utility bill via BBPS simulation
router.post('/bill-pay', authenticateToken, (req, res) => {
  try {
    const { accountId, billerName, billCategory, billerAccountNumber, amount } = req.body;
    const payAmount = parseFloat(amount);

    if (!accountId || !billerName || isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Biller name, consumer ID, and valid payment amount are required.' });
    }

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (account.status === 'frozen') {
      return res.status(400).json({ error: 'Account is frozen.' });
    }
    if (account.balance < payAmount) {
      return res.status(400).json({ error: `Insufficient funds. Current balance: ₹${account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` });
    }

    const newBalance = Math.round((account.balance - payAmount) * 100) / 100;
    const refId = generateTxnRef('TXN-IN-BBPS');

    executeTransaction((txnDb) => {
      txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, account.id);
      txnDb.prepare(`
        INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
        VALUES (?, ?, 'bill_payment', ?, ?, ?, ?, 'BBPS', ?, 'Utilities', 'completed')
      `).run(refId, account.id, payAmount, newBalance, billerAccountNumber || 'REF-BILL', billerName, `Bharat BillPay - ${billCategory || 'Utility'}`);
    });

    return res.json({
      message: `Bill payment of ₹${payAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${billerName} completed via BBPS!`,
      referenceId: refId,
      newBalance
    });
  } catch (err) {
    console.error('Bill payment error:', err);
    return res.status(500).json({ error: 'Bill payment failed.' });
  }
});

// GET /api/transactions - List user's transactions
router.get('/', authenticateToken, (req, res) => {
  try {
    const { accountId, type, category, search, limit = 50 } = req.query;

    let query = `
      SELECT t.*, a.account_number, a.account_type, a.ifsc_code 
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params = [req.user.id];

    if (accountId) {
      query += ' AND t.account_id = ?';
      params.push(accountId);
    }
    if (type && type !== 'all') {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      query += ' AND t.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (t.description LIKE ? OR t.counterparty_name LIKE ? OR t.reference_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const transactions = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN t.type IN ('deposit', 'transfer_in') THEN t.amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN t.type IN ('withdrawal', 'transfer_out', 'bill_payment') THEN t.amount ELSE 0 END) as totalExpense
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
    `).get(req.user.id);

    return res.json({
      transactions,
      stats: {
        totalIncome: stats.totalIncome || 0,
        totalExpense: stats.totalExpense || 0
      }
    });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

export default router;
