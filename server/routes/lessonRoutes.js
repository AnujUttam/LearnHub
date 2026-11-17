
const express = require("express");
const router = express.Router();

const upload = require("../config/multer");

const {
  addLesson,
  getLessons
} = require("../controllers/lessonController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Add video lesson
router.post(
  "/:courseId",
  protect,
  authorize("instructor", "admin"),
  upload.single("video"),
  addLesson
);

// Get course lessons
router.get(
  "/:courseId",
  protect,
  getLessons
);

module.exports = router;
