const express = require('express');
const router = express.Router();
const { createUser } = require('../services/userservices');
const db = require('../config/mysql');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate role
    if (role && !['user', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "mentor"' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const result = await createUser({ name, email, phone, password, role: role || 'user' });
    
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users by role (for admin dashboard)
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['user', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "mentor"' });
    }

    const query = "SELECT id, name, email, phone, role, is_verified, is_active, created_at FROM users WHERE role = ? ORDER BY created_at DESC";
    const [rows] = await db.query(query, [role]);
    
    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('Get users by role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for admin dashboard)
router.get('/all', async (req, res) => {
  try {
    const query = "SELECT id, name, email, phone, role, is_verified, is_active, created_at FROM users ORDER BY created_at DESC";
    const [rows] = await db.query(query);
    
    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
