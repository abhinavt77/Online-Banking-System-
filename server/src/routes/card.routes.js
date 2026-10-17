import { Router } from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function generateCardNumber(brand = 'RuPay') {
  const prefix = brand === 'RuPay' ? '6071' : brand === 'Visa' ? '4532' : '5412';
  const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  return prefix + random12;
}

// GET /api/cards
router.get('/', authenticateToken, (req, res) => {
  try {
    const cards = db.prepare(`
      SELECT c.*, a.account_number, a.account_type, a.ifsc_code 
      FROM cards c
      JOIN accounts a ON c.account_id = a.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `).all(req.user.id);

    return res.json({ cards });
  } catch (err) {
    console.error('Fetch cards error:', err);
    return res.status(500).json({ error: 'Failed to retrieve cards.' });
  }
});

// PATCH /api/cards/:id/freeze - Toggle freeze
router.patch('/:id/freeze', authenticateToken, (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    const newFreezeStatus = card.is_frozen === 1 ? 0 : 1;
    db.prepare('UPDATE cards SET is_frozen = ? WHERE id = ?').run(newFreezeStatus, card.id);

    return res.json({
      message: newFreezeStatus === 1 ? 'Card has been locked / frozen.' : 'Card has been unlocked and is active.',
      isFrozen: newFreezeStatus === 1
    });
  } catch (err) {
    console.error('Toggle freeze error:', err);
    return res.status(500).json({ error: 'Failed to update card status.' });
  }
});

// PATCH /api/cards/:id/limit - Update daily limit in INR
router.patch('/:id/limit', authenticateToken, (req, res) => {
  try {
    const { dailyLimit } = req.body;
    const limit = parseFloat(dailyLimit);
    if (isNaN(limit) || limit < 1000 || limit > 1000000) {
      return res.status(400).json({ error: 'Daily limit must be between ₹1,000 and ₹10,00,000.' });
    }

    const card = db.prepare('SELECT id FROM cards WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    db.prepare('UPDATE cards SET daily_limit = ? WHERE id = ?').run(limit, card.id);
    return res.json({ message: 'Daily POS / ATM limit updated successfully!', dailyLimit: limit });
  } catch (err) {
    console.error('Update limit error:', err);
    return res.status(500).json({ error: 'Failed to update limit.' });
  }
});

// POST /api/cards - Issue new RuPay / Visa / Mastercard
router.post('/', authenticateToken, (req, res) => {
  try {
    const { accountId, cardType, brand } = req.body;
    const selectedBrand = ['RuPay', 'Visa', 'Mastercard'].includes(brand) ? brand : 'RuPay';
    const selectedType = cardType === 'credit' ? 'credit' : 'debit';

    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(accountId, req.user.id);
    if (!account) {
      return res.status(400).json({ error: 'Valid linked bank account required.' });
    }

    const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
    const cardNum = generateCardNumber(selectedBrand);
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const expiryYear = new Date().getFullYear() + 5;
    const expiryMonth = Math.floor(1 + Math.random() * 12);
    const dailyLimit = selectedType === 'credit' ? 250000.00 : 75000.00;

    const stmt = db.prepare(`
      INSERT INTO cards (user_id, account_id, card_number, card_holder, card_type, brand, expiry_month, expiry_year, cvv, is_frozen, daily_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);
    const result = stmt.run(req.user.id, account.id, cardNum, user.full_name.toUpperCase(), selectedType, selectedBrand, expiryMonth, expiryYear, cvv, dailyLimit);

    const createdCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: `New virtual ${selectedBrand} card issued instantly!`, card: createdCard });
  } catch (err) {
    console.error('Issue card error:', err);
    return res.status(500).json({ error: 'Failed to issue card.' });
  }
});

export default router;
