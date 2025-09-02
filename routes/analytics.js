const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Dashboard Analytics
router.get('/', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM verifications',
    `SELECT COUNT(*) as recent FROM verifications WHERE created_at > datetime('now', '-24 hours')`,
    `SELECT COUNT(*) as weekly FROM verifications WHERE created_at > datetime('now', '-7 days')`,
    `SELECT verification_method, COUNT(*) as count FROM verifications GROUP BY verification_method`,
    'SELECT COUNT(*) as total_users FROM users',
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM verifications
     WHERE created_at > datetime('now', '-30 days')
     GROUP BY DATE(created_at) ORDER BY date`
  ];

  Promise.all(queries.map(query =>
    new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  )).then(results => {
    const [total, recent, weekly, methods, users, daily] = results;

    res.json({
      total_verifications: total[0].total,
      recent_verifications: recent[0].recent,
      weekly_verifications: weekly[0].weekly,
      total_users: users[0].total_users,
      verification_methods: methods,
      daily_verifications: daily
    });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

module.exports = router;