import { Router } from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/beneficiaries
router.get('/', authenticateToken, (req, res) => {
  try {
    const beneficiaries = db.prepare(`
      SELECT * FROM beneficiaries 
      WHERE user_id = ? 
      ORDER BY id DESC
    `).all(req.user.id);

    return res.json({ beneficiaries });
  } catch (err) {
    console.error('Fetch beneficiaries error:', err);
    return res.status(500).json({ error: 'Failed to retrieve beneficiaries.' });
  }
});

// POST /api/beneficiaries - Add new payee
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, accountNumber, ifscCode, bankName, upiId, nickname } = req.body;

    if (!name || (!accountNumber && !upiId)) {
      return res.status(400).json({ error: 'Beneficiary name and either Account Number or UPI ID are required.' });
    }

    const cleanAcc = accountNumber ? accountNumber.trim() : '';
    const cleanUpi = upiId ? upiId.trim().toLowerCase() : '';

    // Check duplicate
    const existing = db.prepare(`
      SELECT id FROM beneficiaries 
      WHERE user_id = ? AND ((account_number != '' AND account_number = ?) OR (upi_id != '' AND LOWER(upi_id) = ?))
    `).get(req.user.id, cleanAcc, cleanUpi);

    if (existing) {
      return res.status(400).json({ error: 'This beneficiary is already saved in your contacts.' });
    }

    const stmt = db.prepare(`
      INSERT INTO beneficiaries (user_id, name, account_number, ifsc_code, bank_name, upi_id, nickname)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.user.id, 
      name.trim(), 
      cleanAcc, 
      ifscCode ? ifscCode.trim().toUpperCase() : 'APEX0001021', 
      bankName || 'Apex Bank', 
      cleanUpi, 
      nickname || name.trim()
    );

    const created = db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: 'Payee added successfully!', beneficiary: created });
  } catch (err) {
    console.error('Add beneficiary error:', err);
    return res.status(500).json({ error: 'Failed to add beneficiary.' });
  }
});

// DELETE /api/beneficiaries/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM beneficiaries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Beneficiary not found.' });
    }
    return res.json({ message: 'Payee removed successfully.' });
  } catch (err) {
    console.error('Delete beneficiary error:', err);
    return res.status(500).json({ error: 'Failed to delete beneficiary.' });
  }
});

export default router;
