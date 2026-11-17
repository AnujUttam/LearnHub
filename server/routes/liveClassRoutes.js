const express = require("express");
const router = express.Router();

const {
  createLiveClass,
  getLiveClasses,
  getInstructorLiveClasses,
  getUpcomingLiveClasses,
  updateLiveClassStatus,
  joinLiveClass,
  deleteLiveClass
} = require("../controllers/liveClassController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Instructor / Admin: List own scheduled classes
router.get(
  "/instructor/my-classes",
  protect,
  authorize("instructor", "admin"),
  getInstructorLiveClasses
);

// Students: List upcoming classes for enrolled courses
router.get(
  "/upcoming",
  protect,
  getUpcomingLiveClasses
);

// Get classes for a specific course
router.get(
  "/course/:courseId",
  protect,
  getLiveClasses
);

// Schedule class
router.post(
  "/",
  protect,
  authorize("instructor", "admin"),
  createLiveClass
);

// Join class (token generation & waiting room)
router.post(
  "/:id/join",
  protect,
  joinLiveClass
);

// Update status (e.g. start/end/cancel)
router.patch(
  "/:id/status",
  protect,
  authorize("instructor", "admin"),
  updateLiveClassStatus
);

// Delete live class
router.delete(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  deleteLiveClass
);

module.exports = router;