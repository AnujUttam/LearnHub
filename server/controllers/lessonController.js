
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { notifyMany } = require("../utils/notificationHelper");
const path = require("path");

// ADD LESSON
const addLesson = async (req, res) => {
  try {
    const { title, duration, isPreview } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Lesson title and video are required"
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const lessonDuration = Number(duration) || 0;

    const videoUrl = `/uploads/${path.basename(req.file.filename)}`;

    course.lessons.push({
      title,
      videoUrl,
      duration: lessonDuration,
      isPreview: isPreview === "true"
    });

    course.totalDuration += lessonDuration;

    await course.save();

    // Notify enrolled students
    if (course.enrolledStudents?.length > 0) {
      notifyMany(course.enrolledStudents, {
        title: "New Lesson Added",
        message: `A new lesson "${title}" is now available in "${course.title}".`,
        type: "lesson",
        link: `/dashboard/learn/${course._id}`
      });
    }

    return res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      course
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET COURSE LESSONS
const getLessons = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const isInstructor =
      course.instructor.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      status: "active"
    });

    const isEnrolled = Boolean(enrollment);

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "Please enroll in this course"
      });
    }

    // Enrolled students can access all lesson videos.
    const lessons = course.lessons.map((lesson) =>
      lesson.toObject()
    );

    return res.status(200).json({
      success: true,
      count: lessons.length,
      lessons
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  addLesson,
  getLessons
};
