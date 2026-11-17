
const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/", courseController.getAllCourses);

router.get(
  "/instructor/my-courses",
  protect,
  authorize("instructor", "admin"),
  courseController.getInstructorCourses
);

router.get("/:id", courseController.getCourseById);

// Instructor/Admin routes
router.post(
  "/",
  protect,
  authorize("instructor", "admin"),
  courseController.createCourse
);

router.put(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  courseController.updateCourse
);

router.delete(
  "/:id",
  protect,
  authorize("instructor", "admin"),
  courseController.deleteCourse
);

module.exports = router;
