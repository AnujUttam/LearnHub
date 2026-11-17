const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const LiveClass = require("../models/LiveClass");
const Payment = require("../models/Payment");

// ================= USER PROFILE =================
const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      bio: req.user.bio,
      isActive: req.user.isActive
    }
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= STUDENT DASHBOARD STATS =================
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    const [enrollments, attempts, upcomingClasses] = await Promise.all([
      Enrollment.find({ student: studentId }).populate("course", "title category totalDuration"),
      QuizAttempt.find({ student: studentId, status: "completed" }),
      LiveClass.find({
        status: { $in: ["scheduled", "live"] },
        scheduledAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      })
    ]);

    const activeEnrollments = enrollments.filter((e) => e.course);
    const completedCourses = activeEnrollments.filter((e) => e.progress === 100).length;

    // Filter upcoming classes only for courses enrolled
    const enrolledCourseIds = new Set(activeEnrollments.map((e) => e.course._id.toString()));
    const myUpcomingClasses = upcomingClasses.filter((c) =>
      enrolledCourseIds.has(c.course.toString())
    );

    const totalLearningMinutes = activeEnrollments.reduce((acc, curr) => {
      const duration = curr.course.totalDuration || 0;
      return acc + Math.round((duration * (curr.progress || 0)) / 100);
    }, 0);

    const averageQuizScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
          )
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        enrolledCourses: activeEnrollments.length,
        completedCourses,
        liveClassesCount: myUpcomingClasses.length,
        quizzesCompleted: attempts.length,
        averageQuizScore,
        learningHours: (totalLearningMinutes / 60).toFixed(1)
      },
      recentEnrollments: activeEnrollments.slice(0, 4)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= INSTRUCTOR DASHBOARD STATS =================
const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const [courses, quizzes, liveClasses] = await Promise.all([
      Course.find({ instructor: instructorId }),
      Quiz.find({ instructor: instructorId }),
      LiveClass.find({ instructor: instructorId })
    ]);

    const courseIds = courses.map((c) => c._id);

    // Get verified payments for revenue
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: "completed"
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Unique students enrolled across all courses
    const allEnrolledStudents = new Set();
    courses.forEach((c) => {
      (c.enrolledStudents || []).forEach((s) => allEnrolledStudents.add(s.toString()));
    });

    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = courses.length - publishedCourses;

    // Course-wise student data for Recharts
    const courseEnrollmentData = courses.map((c) => ({
      name: c.title.length > 20 ? c.title.substring(0, 18) + "..." : c.title,
      students: c.enrolledStudents?.length || 0,
      price: c.price,
      isPublished: c.isPublished
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalCourses: courses.length,
        publishedCourses,
        draftCourses,
        totalStudents: allEnrolledStudents.size,
        totalQuizzes: quizzes.length,
        totalLiveClasses: liveClasses.length,
        totalRevenue
      },
      courseEnrollmentData,
      recentCourses: courses.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= INSTRUCTOR STUDENTS LIST =================
const getInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructor: instructorId }).select("_id title");
    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate("student", "name email avatar")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    const students = enrollments
      .filter((e) => e.student && e.course)
      .map((e) => ({
        id: e._id,
        studentName: e.student.name,
        studentEmail: e.student.email,
        studentAvatar: e.student.avatar,
        courseId: e.course._id,
        courseTitle: e.course.title,
        progress: e.progress || 0,
        completedLessonsCount: e.completedLessons?.length || 0,
        enrolledAt: e.enrolledAt,
        status: e.status
      }));

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN STATS & USER MANAGEMENT (PHASE 6) =================
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      payments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      Payment.find({ status: "completed" })
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalEnrollments,
        totalPayments: payments.length,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (role && ["student", "instructor", "admin"].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Protect superadmin from deactivation
    if (user.role === "admin" && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account"
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStudentStats,
  getInstructorStats,
  getInstructorStudents,
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  getAdminCourses
};