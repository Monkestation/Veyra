const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { validatePassword, validateRequired } = require('../utils/validation');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const validation = validateRequired(['username', 'password'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logActivity(user.id, 'login');
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const validation = validateRequired(['currentPassword', 'newPassword'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }

  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      logActivity(req.user.id, 'password_change');
      res.json({ message: 'Password changed successfully' });
    });
  });
});

module.exports = router;