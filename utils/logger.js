const { db } = require('../config/database');

// Activity logging helper
const logActivity = (userId, action, details = null) => {
  db.run('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, details]);
};

module.exports = {
  logActivity
};