const express = require('express');
const router = express.Router();
const db = require('../config/mysql');

/**
 * Get user sessions (upcoming and history) for admin view
 * GET /api/admin/users/:userId/sessions
 */
router.get('/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;

    // First, get user info to determine if they're a mentor or mentee
    const [userRows] = await db.query(
      'SELECT id, name, role FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userRows[0];
    const currentDateTime = new Date();

    let upcomingSessions = [];
    let sessionHistory = [];

    if (user.role === 'mentor') {
      // Get mentor's sessions (bookings where they are the mentor)
      const [upcoming] = await db.query(`
        SELECT 
          b.id,
          b.user_id,
          b.status,
          b.session_date as date,
          b.session_start_time as start_time,
          b.session_end_time as end_time,
          b.notes as topic,
          b.created_at,
          u.name as user_name,
          u.email as user_email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.mentor_id = ? 
          AND (
            b.session_date > CURDATE() 
            OR (b.session_date = CURDATE() AND b.session_start_time > CURTIME())
          )
        ORDER BY b.session_date ASC, b.session_start_time ASC
      `, [userId]);

      const [history] = await db.query(`
        SELECT 
          b.id,
          b.user_id,
          b.status,
          b.session_date as date,
          b.session_start_time as start_time,
          b.session_end_time as end_time,
          b.notes as topic,
          b.created_at,
          u.name as user_name,
          u.email as user_email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.mentor_id = ? 
          AND (
            b.session_date < CURDATE() 
            OR (b.session_date = CURDATE() AND b.session_start_time <= CURTIME())
          )
        ORDER BY b.session_date DESC, b.session_start_time DESC
      `, [userId]);

      upcomingSessions = upcoming;
      sessionHistory = history;

    } else {
      // Get mentee's sessions (bookings they made)
      const [upcoming] = await db.query(`
        SELECT 
          b.id,
          b.mentor_id,
          b.status,
          b.session_date as date,
          b.session_start_time as start_time,
          b.session_end_time as end_time,
          b.notes as topic,
          b.created_at,
          m.name as mentor_name,
          m.email as mentor_email
        FROM bookings b
        JOIN users m ON b.mentor_id = m.id
        WHERE b.user_id = ? 
          AND (
            b.session_date > CURDATE() 
            OR (b.session_date = CURDATE() AND b.session_start_time > CURTIME())
          )
        ORDER BY b.session_date ASC, b.session_start_time ASC
      `, [userId]);

      const [history] = await db.query(`
        SELECT 
          b.id,
          b.mentor_id,
          b.status,
          b.session_date as date,
          b.session_start_time as start_time,
          b.session_end_time as end_time,
          b.notes as topic,
          b.created_at,
          m.name as mentor_name,
          m.email as mentor_email
        FROM bookings b
        JOIN users m ON b.mentor_id = m.id
        WHERE b.user_id = ? 
          AND (
            b.session_date < CURDATE() 
            OR (b.session_date = CURDATE() AND b.session_start_time <= CURTIME())
          )
        ORDER BY b.session_date DESC, b.session_start_time DESC
      `, [userId]);

      upcomingSessions = upcoming;
      sessionHistory = history;
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        upcoming: upcomingSessions,
        history: sessionHistory
      }
    });

  } catch (err) {
    console.error('Get user sessions error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

module.exports = router;
