const express = require('express');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const verificationsRoutes = require('./verifications');
const analyticsRoutes = require('./analytics');

const router = express.Router();

// Route mounting
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/v1/verify', verificationsRoutes);
router.use('/api/analytics', analyticsRoutes);

module.exports = router;