import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

function generateAccountNumber() {
  const prefix = '5010';
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  return prefix + random8;
}

function generateCardNumber(brand = 'RuPay') {
  const prefix = brand === 'RuPay' ? '6071' : brand === 'Visa' ? '4532' : '5412';
  const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  return prefix + random12;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { fullName, email, password, phone, pin, panNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const pinHash = bcrypt.hashSync(pin || '1234', 10);
    const cleanPan = (panNumber || 'ABCPS' + Math.floor(1000 + Math.random() * 9000) + 'K').toUpperCase();

    const userStmt = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, phone, role, pin_hash, pan_number, status)
      VALUES (?, ?, ?, ?, 'customer', ?, ?, 'active')
    `);
    const userResult = userStmt.run(fullName.trim(), email.toLowerCase().trim(), passwordHash, phone || '', pinHash, cleanPan);
    const userId = Number(userResult.lastInsertRowid);

    // Auto-create initial Savings Account with ₹5,000 opening bonus for demonstration
    const accNumber = generateAccountNumber();
    const upiUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90);
    const upiId = `${upiUsername}@apexbank`;

    const accStmt = db.prepare(`
      INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, ifsc_code, branch_name, upi_id)
      VALUES (?, ?, 'savings', 'INR', 5000.00, 'active', 'APEX0001021', 'Connaught Place, New Delhi', ?)
    `);
    const accResult = accStmt.run(userId, accNumber, upiId);
    const accountId = Number(accResult.lastInsertRowid);

    // Auto-create welcome transaction in INR
    const txnStmt = db.prepare(`
      INSERT INTO transactions (reference_id, account_id, type, amount, balance_after, counterparty_account, counterparty_name, transfer_mode, description, category, status)
      VALUES (?, ?, 'deposit', 5000.00, 5000.00, 'RBI-WELCOME', 'Apex Bank India Welcome Bonus', 'NEFT', 'Opening Balance Incentive (INR)', 'Salary', 'completed')
    `);
    txnStmt.run(`TXN-IN-OPEN-${Date.now()}`, accountId);

    // Auto-issue Virtual RuPay Platinum Debit Card
    const cardStmt = db.prepare(`
      INSERT INTO cards (user_id, account_id, card_number, card_holder, card_type, brand, expiry_month, expiry_year, cvv, is_frozen, daily_limit)
      VALUES (?, ?, ?, ?, 'debit', 'RuPay', 11, 2030, ?, 0, 50000.00)
    `);
    const randomCvv = Math.floor(100 + Math.random() * 900).toString();
    cardStmt.run(userId, accountId, generateCardNumber('RuPay'), fullName.toUpperCase(), randomCvv);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(userId, 'REGISTER', `User created Indian Savings Account ${accNumber} (UPI: ${upiId})`);

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role: 'customer' });

    return res.status(201).json({
      message: 'Account created successfully! Welcome to Apex Bank India.',
      token,
      user: {
        id: userId,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || '',
        role: 'customer',
        panNumber: cleanPan
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended. Please contact bank branch administration.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(user.id, 'LOGIN', 'Successful user sign-in to Indian NetBanking portal');

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      message: 'Signed in successfully!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        panNumber: user.pan_number
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed due to server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, full_name, email, phone, role, pan_number, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(req.user.id);
    return res.json({ user, accounts });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/pin
router.put('/pin', authenticateToken, (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'Security PIN must be exactly 4 digits.' });
    }

    const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(req.user.id);
    if (user.pin_hash && currentPin) {
      const match = bcrypt.compareSync(currentPin, user.pin_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current PIN is incorrect.' });
      }
    }

    const newPinHash = bcrypt.hashSync(newPin, 10);
    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(newPinHash, req.user.id);

    return res.json({ message: 'UPI / Transaction security PIN updated successfully!' });
  } catch (err) {
    console.error('Update PIN error:', err);
    return res.status(500).json({ error: 'Failed to update PIN.' });
  }
});

export default router;
