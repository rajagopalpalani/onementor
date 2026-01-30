const express = require('express');
const router = express.Router();
const { createUser } = require('../services/userservices');
const db = require('../config/mysql');

/**
 * Format phone number: if 10 digits, prepend 91 (India country code)
 * @param {string} phone - Phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If empty after cleaning, return null
  if (!digitsOnly) return null;
  
  // If 10 digits, prepend 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  
  // If already starts with 91 and has 12 digits total, return as is
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return digitsOnly;
  }
  
  // If 11 digits and starts with 0, remove 0 and prepend 91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.substring(1)}`;
  }
  
  // Return cleaned digits (for other formats)
  return digitsOnly;
}

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

    // Format phone number if provided (optional for signup)
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;
    if (phone && !formattedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const result = await createUser({ name, email, phone: formattedPhone, password, role: role || 'user' });
    
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

// Get single user by ID (for admin)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = "SELECT id, name, email, phone, role, is_verified, is_active, created_at FROM users WHERE id = ?";
    const [rows] = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('Get user by ID error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
