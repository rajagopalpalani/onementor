const db = require("../../config/mysql");

/* ===========================
   GET SESSION HISTORY (MENTOR)
=========================== */
exports.getMentorSessionHistory = async (req, res) => {
  try {
    const { mentor_id } = req.params;

    if (!mentor_id) {
      return res.status(400).json({ error: "Mentor ID required" });
    }

    const query = `
      SELECT 
        b.id as booking_id,
        ms.id as slot_id,
        DATE_FORMAT(ms.date, '%Y-%m-%d') AS sessionDate,
        ms.date as date,
        TIME_FORMAT(ms.start_time, '%H:%i:%s') AS startTime,
        TIME_FORMAT(ms.end_time, '%H:%i:%s') AS endTime,
        ms.start_time as start_time,
        ms.end_time as end_time,
        b.notes,
        b.status,
        b.total_amount,
        ms.amount as slot_amount,
        b.payment_status,
        b.meeting_link,
        b.mentor_completed, -- Added mentor_completed
        u.name AS user_name,
        u.email AS user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
      WHERE 
        b.mentor_id = ?
        AND (
          (
            b.status = 'confirmed'
            AND (
              ms.date < CURDATE()
              OR (ms.date = CURDATE() AND ms.end_time < CURTIME())
            )
          )
          OR b.status IN ('completed', 'cancelled')
        )
      ORDER BY ms.date DESC, ms.start_time DESC
    `;

    const [sessions] = await db.query(query, [mentor_id]);

    const formattedSessions = sessions.map(s => ({
      id: s.slot_id,
      booking_id: s.booking_id,
      date: s.sessionDate,
      start_time: s.start_time, // Keep raw time for comparison if needed
      end_time: s.end_time,
      user_name: s.user_name,
      user_email: s.user_email,
      description: s.notes,
      status: s.status,
      paymentStatus: s.payment_status,
      amount: s.slot_amount || s.total_amount,
      meeting_link: s.meeting_link,
      mentor_completed: s.mentor_completed
    }));

    res.json(formattedSessions);

  } catch (err) {
    console.error("Mentor history error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET UPCOMING SESSIONS (MENTOR)
=========================== */
exports.getMentorUpcomingSessions = async (req, res) => {
  try {
    const { mentor_id } = req.params;

    if (!mentor_id) {
      return res.status(400).json({ error: "Mentor ID required" });
    }

    const query = `
      SELECT 
        b.id as booking_id,
        ms.id as slot_id,
        DATE_FORMAT(ms.date, '%Y-%m-%d') AS sessionDate,
        ms.date as date,
        TIME_FORMAT(ms.start_time, '%H:%i:%s') AS startTime,
        TIME_FORMAT(ms.end_time, '%H:%i:%s') AS endTime,
        ms.start_time as start_time,
        ms.end_time as end_time,
        b.notes,
        b.status,
        b.notes,
        b.status,
        b.total_amount,
        ms.amount as slot_amount,
        b.payment_status,
        b.payment_status,
        b.meeting_link,
        u.name AS user_name,
        u.email AS user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
      WHERE 
        b.mentor_id = ?
        AND b.status = 'confirmed'
        AND (
          ms.date > CURDATE()
          OR (
            ms.date = CURDATE()
            AND ms.end_time >= CURTIME()
          )
        )
      ORDER BY ms.date ASC, ms.start_time ASC
    `;

    const [sessions] = await db.query(query, [mentor_id]);

    const formattedSessions = sessions.map(s => ({
      id: s.slot_id,
      booking_id: s.booking_id,
      date: s.sessionDate,
      start_time: s.start_time,
      end_time: s.end_time,
      user_name: s.user_name,
      user_email: s.user_email,
      description: s.notes,
      status: s.status,
      paymentStatus: s.payment_status,
      amount: s.slot_amount || s.total_amount,
      meeting_link: s.meeting_link
    }));

    res.json(formattedSessions);

  } catch (err) {
    console.error("Mentor upcoming error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   MARK SESSION AS COMPLETED (MENTOR)
=========================== */
exports.markSessionComplete = async (req, res) => {
  let connection;
  try {
    const { booking_id } = req.params;
    const { mentor_id } = req.body; // Expect mentor_id in body

    if (!booking_id || !mentor_id) {
      return res.status(400).json({ error: "Booking ID and Mentor ID required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Update mentor_completed
    const [result] = await connection.query(
      "UPDATE bookings SET mentor_completed = 1, mentor_completed_at = NOW() WHERE id = ? AND mentor_id = ?",
      [booking_id, mentor_id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Booking not found or not belonging to mentor" });
    }

    // Check if user also completed
    const [rows] = await connection.query("SELECT user_completed FROM bookings WHERE id = ?", [booking_id]);

    if (rows.length > 0 && rows[0].user_completed) {
      // Both completed -> Mark as COMPLETED and Payout Status
      await connection.query(
        "UPDATE bookings SET status = 'completed', completed_at = NOW(), payout_status = 'ready_for_payout' WHERE id = ?",
        [booking_id]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Session marked as completed by mentor" });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Mark complete error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
