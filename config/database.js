const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const config = require('./config');

const db = new sqlite3.Database(config.DB_PATH);

const initializeDatabase = () => {
  db.serialize(() => {
    // Users table (for API authentication)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Verification records table
    db.run(`CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT UNIQUE NOT NULL,
      ckey TEXT NOT NULL,
      verified_flags TEXT DEFAULT '{}',
      verification_method TEXT DEFAULT 'manual',
      verified_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Activity log table
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Create default admin user if it doesn't exist
    const hashedPassword = bcrypt.hashSync(config.ADMIN_PASSWORD, 10);
    db.run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      [config.ADMIN_USERNAME, hashedPassword, 'admin']);
  });
};

module.exports = {
  db,
  initializeDatabase
};