const express = require("express");
const router = express.Router();
const sessionsController = require("../../controller/coach/sessions");

router.get("/history/:mentor_id", sessionsController.getMentorSessionHistory);
router.get("/upcoming/:mentor_id", sessionsController.getMentorUpcomingSessions);

router.put("/complete/:booking_id", sessionsController.markSessionComplete);

module.exports = router;
