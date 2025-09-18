const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { validatePassword, validateRole, validateRequired, validateUsername } = require('../utils/validation');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ users: rows });
  });
});

// Get single user (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const identifier = req.params.id;
  let sql;
  let params;

  const isNumber = /^\d+$/.test(identifier);

  if (isNumber) {
    sql = "SELECT id, username, role, created_at FROM users WHERE id = ?";
    params = [identifier];
  } else {
    sql = "SELECT id, username, role, created_at FROM users WHERE username = ?";
    params = [identifier];
  }

  db.get(sql, params, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Create user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, role = 'user' } = req.body;

  const validation = validateRequired(['username', 'password'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({ error: usernameValidation.message });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }

  const roleValidation = validateRole(role);
  if (!roleValidation.valid) {
    return res.status(400).json({ error: roleValidation.message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      logActivity(req.user.id, 'create_user', `Created user: ${username} with role: ${role}`);
      res.status(201).json({ message: 'User created successfully', id: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const roleValidation = validateRole(role);
  if (!roleValidation.valid) {
    return res.status(400).json({ error: roleValidation.message });
  }

  // Prevent removing admin role from yourself
  if (req.user.id == userId && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot remove admin role from yourself' });
  }

  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    logActivity(req.user.id, 'update_user', `Updated user ID ${userId} role to: ${role}`);
    res.json({ message: 'User updated successfully' });
  });
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent deleting yourself
  if (req.user.id == userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      logActivity(req.user.id, 'delete_user', `Deleted user: ${user?.username || userId}`);
      res.json({ message: 'User deleted successfully' });
    });
  });
});

module.exports = router;