const db = require("../../config/mysql");

/* ===========================
   TEST ENDPOINT
=========================== */
exports.testUserSessions = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [userCheck] = await db.query(
      "SELECT id, name FROM users WHERE id = ?",
      [user_id]
    );

    const [bookings] = await db.query(
      "SELECT * FROM bookings WHERE user_id = ?",
      [user_id]
    );

    res.json({
      success: true,
      userExists: userCheck.length > 0,
      totalBookings: bookings.length,
      bookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET UPCOMING SESSIONS
=========================== */
exports.getUpcomingSessions = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "User ID required" });
    }

    const query = `
      SELECT 
        b.id AS booking_id,
        ms.id AS slot_id,
        DATE_FORMAT(ms.date, '%Y-%m-%d') AS sessionDate,
        TIME_FORMAT(ms.start_time, '%H:%i:%s') AS startTime,
        TIME_FORMAT(ms.end_time, '%H:%i:%s') AS endTime,
        b.notes,
        b.status,
        b.amount AS total_amount,
        ms.amount AS slot_amount,
        b.payment_status,
        b.meeting_link,
        m.name AS coachName,
        m.email AS coachEmail,
        mp.category AS sessionType,
        mp.bio AS coachBio
      FROM bookings b
      JOIN users m ON b.mentor_id = m.id
      JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
      LEFT JOIN mentor_profiles mp ON mp.user_id = b.mentor_id
      WHERE 
        b.user_id = ?
        AND b.status IN ('confirmed', 'completed')
        AND (
          ms.date > CURDATE()
          OR (
            ms.date = CURDATE()
            AND ms.start_time > CURTIME()
          )
        )
      ORDER BY ms.date ASC, ms.start_time ASC
    `;

    const [sessions] = await db.query(query, [user_id]);

    const formattedSessions = sessions.map(s => ({
      id: s.slot_id,
      booking_id: s.booking_id,
      date: s.sessionDate,
      startTime: s.startTime,
      endTime: s.endTime,
      coachName: s.coachName,
      coachEmail: s.coachEmail,
      sessionType: s.sessionType || "General Coaching",
      description: s.notes,
      status: s.status,
      paymentStatus: s.payment_status,
      amount: s.slot_amount || (s.total_amount / (sessions.filter(x => x.booking_id === s.booking_id).length || 1)),
      coachBio: s.coachBio,
      meetingLink: s.meeting_link
    }));

    res.json({
      success: true,
      count: formattedSessions.length,
      sessions: formattedSessions
    });

  } catch (err) {
    console.error("Upcoming error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET SESSION HISTORY
=========================== */
exports.getSessionHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "User ID required" });
    }

    const query = `
      SELECT 
        b.id AS booking_id,
        ms.id AS slot_id,
        DATE_FORMAT(ms.date, '%Y-%m-%d') AS sessionDate,
        TIME_FORMAT(ms.start_time, '%H:%i:%s') AS startTime,
        TIME_FORMAT(ms.end_time, '%H:%i:%s') AS endTime,
        b.notes,
        b.status,
        b.amount AS total_amount,
        ms.amount AS slot_amount,
        b.payment_status,
        b.meeting_link,
        b.created_at,
        m.name AS coachName,
        m.email AS coachEmail,
        mp.category AS sessionType,
        mp.bio AS coachBio
      FROM bookings b
      JOIN users m ON b.mentor_id = m.id
      JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
      LEFT JOIN mentor_profiles mp ON mp.user_id = b.mentor_id
      WHERE 
        b.user_id = ?
        AND b.status IN ('confirmed', 'completed')
        AND (
          ms.date < CURDATE()
          OR (
            ms.date = CURDATE()
            AND ms.end_time < CURTIME()
          )
        )
      ORDER BY ms.date DESC, ms.start_time DESC
      LIMIT ? OFFSET ?
    `;

    const [sessions] = await db.query(query, [
      user_id,
      Number(limit),
      Number(offset)
    ]);

    const [[countResult]] = await db.query(
      `
        SELECT COUNT(ms.id) AS total
        FROM bookings b
        JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
        WHERE 
          b.user_id = ?
          AND b.status IN ('confirmed', 'completed')
          AND (
            ms.date < CURDATE()
            OR (
              ms.date = CURDATE()
              AND ms.end_time < CURTIME()
            )
          )
      `,
      [user_id]
    );

    const formattedSessions = sessions.map(s => ({
      id: s.slot_id,
      booking_id: s.booking_id,
      date: s.sessionDate,
      startTime: s.startTime,
      endTime: s.endTime,
      coachName: s.coachName,
      coachEmail: s.coachEmail,
      sessionType: s.sessionType || "General Coaching",
      description: s.notes,
      status: s.status,
      paymentStatus: s.payment_status,
      amount: s.slot_amount || (s.total_amount / (sessions.filter(x => x.booking_id === s.booking_id).length || 1)),
      coachBio: s.coachBio,
      createdAt: s.created_at,
      meetingLink: s.meeting_link
    }));

    res.json({
      success: true,
      count: formattedSessions.length,
      total: countResult.total,
      sessions: formattedSessions
    });

  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET USER DASHBOARD STATS
=========================== */
exports.getUserStats = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "User ID required" });
    }

    // 1. Total Sessions (Count individual slots)
    const [[totalResult]] = await db.query(
      `SELECT COUNT(ms.id) AS total 
       FROM bookings b
       JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
       WHERE b.user_id = ? AND b.status IN ('confirmed', 'completed')`,
      [user_id]
    );

    // 2. Active Coaches (All available mentors on platform)
    const [[coachResult]] = await db.query(
      `SELECT COUNT(u.id) AS activeCoaches 
       FROM users u
       INNER JOIN mentor_profiles mp ON u.id = mp.user_id
       WHERE u.role = 'mentor' AND u.is_active = 1 AND mp.registered = 1`
    );

    // 3. Upcoming Sessions (Count individual slots)
    const [[upcomingResult]] = await db.query(
      `SELECT COUNT(ms.id) AS upcoming 
       FROM bookings b
       JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
       WHERE b.user_id = ? 
       AND b.status = 'confirmed' 
       AND (ms.date > CURDATE() OR (ms.date = CURDATE() AND ms.start_time > CURTIME()))`,
      [user_id]
    );

    // 4. Progress (Completed slots / Total slots)
    const [[completedResult]] = await db.query(
      `SELECT COUNT(ms.id) AS completed 
       FROM bookings b
       JOIN mentor_slots ms ON JSON_CONTAINS(b.slots, CAST(ms.id AS JSON))
       WHERE b.user_id = ? AND b.status = 'completed'`,
      [user_id]
    );

    const total = totalResult.total || 0;
    const completed = completedResult.completed || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalSessions: total,
        activeCoaches: coachResult.activeCoaches || 0,
        upcoming: upcomingResult.upcoming || 0,
        progress: progress
      }
    });

  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET MEETING DETAILS
=========================== */
exports.getMeetingDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { user_id } = req.query;

    if (!booking_id || !user_id) {
      return res.status(400).json({ error: "Booking ID and User ID required" });
    }

    const [bookings] = await db.query(
      `SELECT b.*, 
              u.name as student_name, u.email as student_email,
              m.name as mentor_name, m.email as mentor_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN users m ON b.mentor_id = m.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookings[0];

    // Access Control
    // Allow strict string comparison to avoid type coercion issues
    if (String(booking.user_id) !== String(user_id) && String(booking.mentor_id) !== String(user_id)) {
      return res.status(403).json({ error: "Unauthorized access to this meeting" });
    }

    // Time Validation
    let slotIds = [];
    if (booking.slots) {
      if (typeof booking.slots === 'string') {
        try {
          slotIds = JSON.parse(booking.slots);
        } catch (e) { slotIds = []; }
      } else {
        slotIds = booking.slots;
      }
    }

    if (!slotIds || slotIds.length === 0) {
      return res.status(400).json({ error: "No slots found for this booking" });
    }

    const placeholders = slotIds.map(() => '?').join(',');
    const [slots] = await db.query(
      `SELECT date, start_time, end_time FROM mentor_slots WHERE id IN (${placeholders}) ORDER BY date ASC, start_time ASC`,
      slotIds
    );

    if (slots.length === 0) {
      return res.status(400).json({ error: "Slots data missing" });
    }

    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];

    // Construct Date objects manually to ensure correct parsing (assuming stored as YYYY-MM-DD and HH:mm:ss)
    // Note: dates from DB might be JS Date objects already if driver handles DATE type.
    // TIME type comes as string usually.
    // Let's assume date is Date object and start_time is string "HH:MM:SS"

    const formatDate = (dateObj, timeStr) => {
      const d = new Date(dateObj);
      const [h, m, s] = timeStr.split(':');
      d.setHours(parseInt(h), parseInt(m), parseInt(s) || 0);
      return d;
    };

    const startDateTime = formatDate(firstSlot.date, firstSlot.start_time);
    const endDateTime = formatDate(lastSlot.date, lastSlot.end_time);
    const now = new Date();

    // Development mode: bypass time validation for testing
    // Set ENABLE_MEETING_TIME_VALIDATION=false in .env to disable time checks
    const enableTimeValidation = process.env.ENABLE_MEETING_TIME_VALIDATION !== 'false';

    if (enableTimeValidation) {
      // Allow joining 10 minutes before
      const allowJoinTime = new Date(startDateTime.getTime() - 10 * 60000);

      // Time validation - prevent joining after session end
      if (now > endDateTime) {
        return res.json({
          success: false,
          status: 'ended',
          message: "This session has ended. You cannot join after the session end time."
        });
      } else if (now >= allowJoinTime) {
        // Live - allow joining
      } else {
        return res.json({
          success: false,
          status: 'upcoming',
          startTime: startDateTime,
          message: "Session has not started yet. You can join 10 minutes before start."
        });
      }
    } else {
      // Development mode: allow joining regardless of time
      console.log('⚠️  Development mode: Time validation disabled for testing');
    }

    // Generate Jitsi room details - ensure same room for user and mentor
    const jitsiService = require('../../services/jitsiService');
    const isMentor = String(booking.mentor_id) === String(user_id);
    
    // Check if meeting_link already exists in database (from previous generation)
    let existingRoomName = null;
    if (booking.meeting_link) {
      // Extract room name from existing meeting link
      existingRoomName = jitsiService.extractRoomNameFromUrl(booking.meeting_link);
    }
    
    // Create Jitsi room - will use existing room name if available, otherwise generate deterministic one
    const jitsiRoom = jitsiService.createJitsiRoom({
      bookingId: booking.id,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      user: {
        id: user_id,
        name: isMentor ? booking.mentor_name : booking.student_name,
        email: isMentor ? booking.mentor_email : booking.student_email,
        role: isMentor ? 'mentor' : 'user'
      },
      existingRoomName: existingRoomName // Use existing room name if available
    });
    
    // Store meeting_link in database if it doesn't exist or needs update
    // This ensures both user and mentor use the same room
    if (!booking.meeting_link || existingRoomName !== jitsiRoom.roomName) {
      try {
        await db.query(
          'UPDATE bookings SET meeting_link = ? WHERE id = ?',
          [jitsiRoom.jitsiUrl, booking.id]
        );
      } catch (updateErr) {
        console.error('Error updating meeting_link:', updateErr);
        // Don't fail the request if update fails, just log it
      }
    }

    const userInfo = {
      displayName: isMentor ? booking.mentor_name : booking.student_name,
      email: isMentor ? booking.mentor_email : booking.student_email,
      role: isMentor ? 'mentor' : 'user'
    };

    res.json({
      success: true,
      status: 'live',
      roomName: jitsiRoom.roomName,
      token: jitsiRoom.token,
      jitsiUrl: jitsiRoom.jitsiUrl,
      deepLink: jitsiRoom.deepLink,
      userInfo,
      config: jitsiRoom.config,
      sessionEndTime: endDateTime.toISOString()
    });

  } catch (err) {
    console.error("Meeting details error:", err);
    res.status(500).json({ error: err.message });
  }
};
