
const express = require("express");
const router = express.Router();

const {
  enrollCourse,
  getMyCourses,
  updateProgress,
  markLessonComplete
} = require("../controllers/enrollmentController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Enroll in course
router.post(
  "/",
  protect,
  authorize("student"),
  enrollCourse
);

// Get enrolled courses
router.get(
  "/my-courses",
  protect,
  authorize("student"),
  getMyCourses
);

// Update course progress (existing route)
router.put(
  "/:id/progress",
  protect,
  authorize("student"),
  updateProgress
);

// Mark lesson as completed
router.post(
  "/:courseId/lessons/:lessonId/complete",
  protect,
  authorize("student"),
  markLessonComplete
);

module.exports = router;
