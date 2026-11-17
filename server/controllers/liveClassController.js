const LiveClass = require("../models/LiveClass");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { AccessToken } = require("livekit-server-sdk");

// ================= CREATE LIVE CLASS =================
const createLiveClass = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      scheduledAt,
      duration
    } = req.body;

    if (!title || !course || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Title, course and scheduled date are required"
      });
    }

    const courseData = await Course.findById(course);

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    if (
      courseData.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to schedule live class for this course"
      });
    }

    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled date and time"
      });
    }

    const roomName = `learnhub-${courseData._id.toString().slice(-6)}-${Date.now()}`;

    const liveClass = await LiveClass.create({
      title: title.trim(),
      description: description || "",
      course,
      instructor: req.user._id,
      roomName,
      scheduledAt: scheduleDate,
      duration: Number(duration) || 60,
      status: "scheduled"
    });

    res.status(201).json({
      success: true,
      message: "Live class scheduled successfully",
      liveClass
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET INSTRUCTOR'S LIVE CLASSES =================
const getInstructorLiveClasses = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { instructor: req.user._id };

    const liveClasses = await LiveClass.find(filter)
      .populate("course", "title thumbnail category")
      .sort({ scheduledAt: -1 });

    return res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET UPCOMING LIVE CLASSES (FOR STUDENTS) =================
const getUpcomingLiveClasses = async (req, res) => {
  try {
    // Find all courses student is enrolled in
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $in: ["active", "completed"] }
    });

    const courseIds = enrollments.map((e) => e.course);

    // Classes scheduled from 2 hours ago onwards or with active/live status
    const recentThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const liveClasses = await LiveClass.find({
      course: { $in: courseIds },
      status: { $in: ["scheduled", "live"] },
      scheduledAt: { $gte: recentThreshold }
    })
      .populate("course", "title thumbnail")
      .populate("instructor", "name email")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET COURSE LIVE CLASSES =================
const getLiveClasses = async (req, res) => {
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
      status: { $in: ["active", "completed"] }
    });

    if (!isInstructor && !isAdmin && !enrollment) {
      return res.status(403).json({
        success: false,
        message: "Please enroll in this course to view classes"
      });
    }

    const liveClasses = await LiveClass.find({
      course: course._id,
      status: { $ne: "cancelled" }
    })
      .populate("instructor", "name")
      .sort({ scheduledAt: 1 });

    res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= UPDATE CLASS STATUS =================
const updateLiveClassStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["scheduled", "live", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    const isInstructor =
      liveClass.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this class"
      });
    }

    liveClass.status = status;
    await liveClass.save();

    return res.status(200).json({
      success: true,
      message: `Class status updated to ${status}`,
      liveClass
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= JOIN LIVE CLASS (TOKEN GENERATION) =================
const joinLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id).populate("course", "title");

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    if (["completed", "cancelled"].includes(liveClass.status)) {
      return res.status(400).json({
        success: false,
        message: `This live class has ended (${liveClass.status})`
      });
    }

    const isInstructor =
      liveClass.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: liveClass.course?._id || liveClass.course,
      status: { $in: ["active", "completed"] }
    });

    if (!isInstructor && !isAdmin && !enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to join the live class"
      });
    }

    const startTime = new Date(liveClass.scheduledAt);
    const now = new Date();

    // Instructor early join window: up to 30 mins before scheduled time
    const instructorEarlyWindow = new Date(startTime.getTime() - 30 * 60 * 1000);
    // Student waiting room window: up to 15 mins before scheduled time
    const studentWaitingWindow = new Date(startTime.getTime() - 15 * 60 * 1000);

    // If instructor joins early or on time, start the class
    if (isInstructor || isAdmin) {
      if (now < instructorEarlyWindow) {
        return res.status(400).json({
          success: false,
          message: `Class is scheduled for ${startTime.toLocaleTimeString()}. You can start early up to 30 mins before.`
        });
      }

      if (liveClass.status === "scheduled") {
        liveClass.status = "live";
        await liveClass.save();
      }
    } else {
      // Student logic
      if (liveClass.status === "scheduled") {
        if (now < studentWaitingWindow) {
          return res.status(400).json({
            success: false,
            message: `Class is scheduled for ${startTime.toLocaleString()}. Waiting room opens 15 minutes before start.`
          });
        }

        // Return waiting state before instructor initiates live call
        return res.status(200).json({
          success: true,
          waiting: true,
          roomName: liveClass.roomName,
          title: liveClass.title,
          scheduledAt: liveClass.scheduledAt,
          message: "Waiting for instructor to start the live class..."
        });
      }
    }

    // Verify LiveKit credentials
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return res.status(500).json({
        success: false,
        message: "LiveKit server credentials are not configured on the backend"
      });
    }

    const participantIdentity = `${req.user._id.toString()}-${Date.now()}`;
    const participantName = req.user.name;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: "3h"
    });

    token.addGrant({
      roomJoin: true,
      room: liveClass.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const jwtToken = await token.toJwt();

    return res.status(200).json({
      success: true,
      waiting: false,
      message: "Successfully joined live class",
      serverUrl,
      token: jwtToken,
      roomName: liveClass.roomName,
      isInstructor: isInstructor || isAdmin,
      classTitle: liveClass.title
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= DELETE / CANCEL LIVE CLASS =================
const deleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    const isInstructor =
      liveClass.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this live class"
      });
    }

    await liveClass.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Live class deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createLiveClass,
  getLiveClasses,
  getInstructorLiveClasses,
  getUpcomingLiveClasses,
  updateLiveClassStatus,
  joinLiveClass,
  deleteLiveClass
};