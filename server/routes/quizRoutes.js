const express = require("express");
const router = express.Router();

const {
  createQuiz,
  getCourseQuizzes,
  getQuizById,
  startQuiz,
  submitQuiz,
  getMyQuizResults,
  getInstructorQuizzes,
  updateQuiz,
  deleteQuiz,
  getQuizAttempts,
  publishQuiz
} = require("../controllers/quizController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Instructor / Admin: List own quizzes
router.get(
  "/instructor/my-quizzes",
  protect,
  authorize("instructor", "admin"),
  getInstructorQuizzes
);

// Student: List completed quiz results
router.get(
  "/my-results",
  protect,
  authorize("student", "admin"),
  getMyQuizResults
);

// Course quizzes
router.get(
  "/course/:courseId",
  protect,
  getCourseQuizzes
);

// Create quiz
router.post(
  "/",
  protect,
  authorize("instructor", "admin"),
  createQuiz
);

// Start quiz attempt session (sets startedAt timer on server)
router.post(
  "/:quizId/start",
  protect,
  authorize("student", "admin"),
  startQuiz
);

// Submit quiz
router.post(
  "/:quizId/submit",
  protect,
  authorize("student", "admin"),
  submitQuiz
);

// Publish / Unpublish quiz
router.patch(
  "/:quizId/publish",
  protect,
  authorize("instructor", "admin"),
  publishQuiz
);

// Instructor / Admin: View student attempts for a quiz
router.get(
  "/:id/attempts",
  protect,
  authorize("instructor", "admin"),
  getQuizAttempts
);

// Single quiz details (protected for student / instructor / admin)
router.get(
  "/:id",
  protect,
  getQuizById
);

// Update quiz
router.put(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  updateQuiz
);

// Delete quiz
router.delete(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  deleteQuiz
);

module.exports = router;