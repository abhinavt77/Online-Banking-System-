import { Router } from 'express';
import { db, executeTransaction } from '../db/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

// GET /api/admin/overview
router.get('/overview', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
    const liquidity = db.prepare('SELECT SUM(balance) as total FROM accounts').get().total || 0;
    const totalLoans = db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM loans').get();
    const pendingLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'pending'").get().count;
    const totalTransactions = db.prepare('SELECT COUNT(*) as count, SUM(amount) as volume FROM transactions').get();

    const recentLogs = db.prepare(`
      SELECT l.*, u.full_name, u.email 
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC 
      LIMIT 15
    `).all();

    return res.json({
      metrics: {
        totalUsers,
        totalAccounts,
        totalLiquidity: liquidity,
        totalLoansAmount: totalLoans.total || 0,
        pendingLoansCount: pendingLoans,
        totalTxnCount: totalTransactions.count || 0,
        totalTxnVolume: totalTransactions.volume || 0
      },
      recentLogs
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative overview.' });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.pan_number, u.status, u.created_at,
        COUNT(a.id) as account_count,
        COALESCE(SUM(a.balance), 0) as total_balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `).all();

    return res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Failed to retrieve user list.' });
  }
});

// GET /api/admin/accounts
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT a.*, u.full_name, u.email, u.pan_number 
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.id ASC
    `).all();

    return res.json({ accounts });
  } catch (err) {
    console.error('Admin accounts error:', err);
    return res.status(500).json({ error: 'Failed to retrieve accounts.' });
  }
});

// PATCH /api/admin/accounts/:id/freeze
router.patch('/accounts/:id/freeze', (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const nextStatus = account.status === 'frozen' ? 'active' : 'frozen';
    db.prepare('UPDATE accounts SET status = ? WHERE id = ?').run(nextStatus, account.id);

    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'ACCOUNT_STATUS_CHANGE', `Admin changed account ${account.account_number} status to ${nextStatus}`);

    return res.json({ message: `Account status updated to ${nextStatus}.`, status: nextStatus });
  } catch (err) {
    console.error('Freeze account error:', err);
    return res.status(500).json({ error: 'Failed to update account status.' });
  }
});

// GET /api/admin/loans
router.get('/loans', (req, res) => {
  try {
    const loans = db.prepare(`
      SELECT l.*, u.full_name, u.email, u.pan_number, a.account_number, a.ifsc_code
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN accounts a ON l.account_id = a.id
      ORDER BY CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, l.created_at DESC
    `).all();

    return res.json({ loans });
  } catch (err) {
    console.error('Admin loans error:', err);
    return res.status(500).json({ error: 'Failed to retrieve loans.' });
  }
});

// PATCH /api/admin/loans/:id/decision
router.patch('/loans/:id/decision', (req, res) => {
  try {
    const { decision } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'approved' or 'rejected'." });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found.' });
    }
    if (loan.status !== 'pending') {
      return res.status(400).json({ error: `Loan is already marked as ${loan.status}.` });
    }

    executeTransaction((txnDb) => {
      txnDb.prepare('UPDATE loans SET status = ? WHERE id = ?').run(decision, loan.id);

      if (decision === 'approved') {
        const targetAcc = txnDb.prepare('SELECT * FROM accounts WHERE id = ?').get(loan.account_id);
        if (targetAcc) {
          const newBal = Math.round((targetAcc.balance + loan.amount) * 100) / 100;
          txnDb.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBal, targetAcc.id);
          txnDb.prepare(`
            INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
            VALUES (?, ?, 'deposit', ?, ?, 'LOAN-DISBURSE', 'Apex Lending Dept India', 'NEFT', ?, 'Investment', 'completed')
          `).run(`TXN-IN-LOAN-${Date.now()}`, targetAcc.id, loan.amount, newBal, `Approved Loan Disbursement (INR) - ${loan.purpose}`);
        }
      }

      txnDb.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
        .run(req.user.id, 'LOAN_DECISION', `Admin ${decision} loan #${loan.id} for ₹${loan.amount.toLocaleString('en-IN')}`);
    });

    return res.json({ message: `Loan #${loan.id} has been ${decision}!` });
  } catch (err) {
    console.error('Loan decision error:', err);
    return res.status(500).json({ error: 'Failed to process loan decision.' });
  }
});

export default router;
