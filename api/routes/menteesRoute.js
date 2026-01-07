const express = require('express');
const router = express.Router();
const db = require('../config/mysql');

// Fetch all mentees (users with role 'user')
router.get('/mentees', async (req, res) => {
  try {
    const query = "SELECT id, name, email FROM users WHERE role = 'user'";
    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ data: result });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
