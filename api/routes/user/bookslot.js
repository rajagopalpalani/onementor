const express = require("express");
const router = express.Router();
const bookingController = require("../../controller/user/bookslot");

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Book a slot and initiate payment
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - mentor_id
 *               - slot_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID
 *               mentor_id:
 *                 type: integer
 *                 description: Mentor ID
 *               slot_id:
 *                 type: integer
 *                 description: Slot ID to book
 *               notes:
 *                 type: string
 *                 description: Optional notes for the booking
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid request or slot already booked
 *       500:
 *         description: Server error
 */
router.post("/", bookingController.bookSlot);

/**
 * @swagger
 * /api/bookings/user/{user_id}:
 *   get:
 *     summary: Get all bookings for a user
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, rejected]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: List of user bookings
 *       500:
 *         description: Server error
 */
router.get("/user/:user_id", bookingController.getUserBookings);

/**
 * @swagger
 * /api/bookings/mentor/{mentor_id}:
 *   get:
 *     summary: Get all bookings for a mentor
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: mentor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mentor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled, rejected]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: List of mentor bookings
 *       500:
 *         description: Server error
 */
router.get("/mentor/:mentor_id", bookingController.getMentorBookings);

module.exports = router;
