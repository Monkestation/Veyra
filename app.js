const express = require('express');
const path = require('path');
const config = require('./config/config');
const { initializeDatabase } = require('./config/database');
const rateLimiter = require('./middleware/rateLimiter');
const routes = require('./routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
app.use('/api/', rateLimiter);

// Initialize database
initializeDatabase();

// Routes
app.use('/', routes);

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Verification API server running on port ${config.PORT}`);
  console.log(`Dashboard available at http://localhost:${config.PORT}`);
  console.log(`Default admin credentials: ${config.ADMIN_USERNAME}/${config.ADMIN_PASSWORD}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  const { db } = require('./config/database');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});