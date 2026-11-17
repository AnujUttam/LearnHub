
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { createNotification } = require("../utils/notificationHelper");

// ==========================================
// 1. ENROLL STUDENT IN A COURSE
// ==========================================

const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }

    // Find published course
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Published course not found"
      });
    }

    // Check existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "Already enrolled in this course",
        enrollment: existingEnrollment
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      progress: 0,
      completedLessons: [],
      status: "active"
    });

    // Add student to course
    course.enrolledStudents.addToSet(req.user._id);
    await course.save();

    // Trigger in-app notifications
    createNotification({
      recipient: req.user._id,
      title: "Enrollment Confirmed",
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      type: "enrollment",
      link: `/dashboard/learn/${course._id}`
    });

    createNotification({
      recipient: course.instructor,
      title: "New Student Enrolled",
      message: `${req.user.name} has enrolled in your course "${course.title}".`,
      type: "enrollment",
      link: `/dashboard/students`
    });

    return res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment
    });

  } catch (error) {
    console.error("Enrollment Error:", error.message);

    // Handle duplicate enrollment index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already enrolled in this course"
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// 2. GET STUDENT'S ENROLLED COURSES
// ==========================================

const getMyCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id
    })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name email"
        }
      })
      .sort({ enrolledAt: -1 });

    // Remove enrollments whose courses no longer exist
    const validEnrollments = enrollments.filter(
      (enrollment) => enrollment.course !== null
    );

    return res.status(200).json({
      success: true,
      count: validEnrollments.length,
      enrollments: validEnrollments
    });

  } catch (error) {
    console.error("Get My Courses Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// 3. UPDATE COURSE LEARNING PROGRESS
// ==========================================

const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    if (
      typeof progress !== "number" ||
      progress < 0 ||
      progress > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100"
      });
    }

    // Find student's enrollment
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      student: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    // Progress cannot decrease
    enrollment.progress = Math.max(
      enrollment.progress,
      progress
    );

    // Mark course completed at 100%
    if (enrollment.progress === 100) {
      enrollment.status = "completed";
    }

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Course progress updated successfully",
      enrollment
    });

  } catch (error) {
    console.error("Update Progress Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// MARK LESSON AS COMPLETE
const markLessonComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Find active student enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: "active"
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Active enrollment not found"
      });
    }

    // Find course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Verify lesson belongs to this course
    const lesson = course.lessons.id(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course"
      });
    }

    const totalLessons = course.lessons.length;

    if (totalLessons === 0) {
      return res.status(400).json({
        success: false,
        message: "This course has no lessons"
      });
    }

    // Add lesson only if not already completed
    if (!enrollment.completedLessons.some(
      (id) => id.toString() === lessonId
    )) {
      enrollment.completedLessons.push(lessonId);
    }

    // Calculate progress
    const completedCount = enrollment.completedLessons.length;

    enrollment.progress = Math.min(
      100,
      Math.round((completedCount / totalLessons) * 100)
    );

    // Update enrollment status
    enrollment.status =
      enrollment.progress === 100 ? "completed" : "active";

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      status: enrollment.status
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  enrollCourse,
  getMyCourses,
  updateProgress,
  markLessonComplete
};
