const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { validateRequired } = require('../utils/validation');

const router = express.Router();

// Get specific verification by Discord ID
router.get('/:discord_id', authenticateToken, (req, res) => {
  const discordId = req.params.discord_id;

  db.get('SELECT * FROM verifications WHERE discord_id = ?', [discordId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    res.json({
      discord_id: row.discord_id,
      ckey: row.ckey,
      verified_flags: JSON.parse(row.verified_flags || '{}'),
      verification_method: row.verification_method,
      verified_by: row.verified_by,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  });
});

// Get all verifications with pagination and search
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM verifications';
  let params = [];

  if (search) {
    query += ' WHERE discord_id LIKE ? OR ckey LIKE ?';
    params = [`%${search}%`, `%${search}%`];
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const verifications = rows.map(row => ({
      discord_id: row.discord_id,
      ckey: row.ckey,
      verified_flags: JSON.parse(row.verified_flags || '{}'),
      verification_method: row.verification_method,
      verified_by: row.verified_by,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.json({ verifications, page: parseInt(page), limit: parseInt(limit) });
  });
});

// Create or update verification
router.post('/', authenticateToken, (req, res) => {
  const { discord_id, ckey, verified_flags = {}, verification_method = 'manual' } = req.body;

  const validation = validateRequired(['discord_id', 'ckey'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  // First, check if the verification already exists
  db.get('SELECT verified_flags FROM verifications WHERE discord_id = ?', [discord_id], (err, existingRow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Merge verified_flags if record exists
    let finalVerifiedFlags = verified_flags;
    if (existingRow) {
      const existingFlags = JSON.parse(existingRow.verified_flags || '{}');
      // Merge existing flags with new flags (new flags take precedence)
      finalVerifiedFlags = { ...existingFlags, ...verified_flags };
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO verifications
      (discord_id, ckey, verified_flags, verification_method, verified_by, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run([
      discord_id,
      ckey,
      JSON.stringify(finalVerifiedFlags),
      verification_method,
      req.user.username
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const action = existingRow ? 'update_verification' : 'create_verification';
      logActivity(req.user.id, action, `Discord ID: ${discord_id}, Ckey: ${ckey}`);
      
      res.status(201).json({
        message: existingRow ? 'Verification updated successfully' : 'Verification created successfully',
        discord_id,
        ckey,
        verified_flags: finalVerifiedFlags
      });
    });

    stmt.finalize();
  });
});

// Update verification
router.put('/:discord_id', authenticateToken, (req, res) => {
  const discordId = req.params.discord_id;
  const { ckey, verified_flags, verification_method } = req.body;

  let updates = [];
  let params = [];

  if (ckey) {
    updates.push('ckey = ?');
    params.push(ckey);
  }
  if (verified_flags) {
    updates.push('verified_flags = ?');
    params.push(JSON.stringify(verified_flags));
  }
  if (verification_method) {
    updates.push('verification_method = ?');
    params.push(verification_method);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push('verified_by = ?', 'updated_at = CURRENT_TIMESTAMP');
  params.push(req.user.username, discordId);

  const query = `UPDATE verifications SET ${updates.join(', ')} WHERE discord_id = ?`;

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    logActivity(req.user.id, 'update_verification', `Discord ID: ${discordId}`);
    res.json({ message: 'Verification updated successfully' });
  });
});

// Delete verification (Admin only)
router.delete('/:discord_id', authenticateToken, requireAdmin, (req, res) => {
  const discordId = req.params.discord_id;

  db.run('DELETE FROM verifications WHERE discord_id = ?', [discordId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    logActivity(req.user.id, 'delete_verification', `Discord ID: ${discordId}`);
    res.json({ message: 'Verification deleted successfully' });
  });
});

module.exports = router;