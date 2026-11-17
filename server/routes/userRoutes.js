const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getStudentStats,
  getInstructorStats,
  getInstructorStudents,
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  getAdminCourses
} = require("../controllers/userController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Current User Profile
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Student Dashboard Stats
router.get(
  "/student/stats",
  protect,
  authorize("student", "admin"),
  getStudentStats
);

// Instructor Dashboard Stats & Students
router.get(
  "/instructor/stats",
  protect,
  authorize("instructor", "admin"),
  getInstructorStats
);

router.get(
  "/instructor/students",
  protect,
  authorize("instructor", "admin"),
  getInstructorStudents
);

// Admin Routes
router.get(
  "/admin/stats",
  protect,
  authorize("admin"),
  getAdminStats
);

router.get(
  "/admin/users",
  protect,
  authorize("admin"),
  getAdminUsers
);

router.patch(
  "/admin/users/:id/status",
  protect,
  authorize("admin"),
  updateUserStatus
);

router.get(
  "/admin/courses",
  protect,
  authorize("admin"),
  getAdminCourses
);

module.exports = router;