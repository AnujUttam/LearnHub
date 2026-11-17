const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// ================= CREATE QUIZ =================
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      questions,
      passingMarks,
      duration
    } = req.body;

    if (!title || !course || !questions?.length) {
      return res.status(400).json({
        success: false,
        message: "Title, course and questions are required"
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
        message: "Not authorized to create quiz for this course"
      });
    }

    // Validate questions
    for (const question of questions) {
      if (
        !question.questionText ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid question or answer options"
        });
      }
    }

    const totalMarks = questions.reduce(
      (total, question) => total + (question.marks || 1),
      0
    );

    const passMarks = Number(passingMarks) || 0;

    if (passMarks < 0 || passMarks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Invalid passing marks"
      });
    }

    const quiz = await Quiz.create({
      title,
      description: description || "",
      course,
      instructor: req.user._id,
      questions,
      totalMarks,
      passingMarks: passMarks,
      duration: Number(duration) || 30
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET COURSE QUIZZES (STUDENT / COURSE VIEW) =================
const getCourseQuizzes = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const isOwner =
      course.instructor.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      status: { $in: ["active", "completed"] }
    });

    if (!isOwner && !isAdmin && !enrollment) {
      return res.status(403).json({
        success: false,
        message: "Please enroll in this course to view quizzes"
      });
    }

    const filter = {
      course: course._id
    };

    if (!isOwner && !isAdmin) {
      filter.isPublished = true;
    }

    const quizzes = await Quiz.find(filter)
      .select("-questions.correctAnswer")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET SINGLE QUIZ BY ID =================
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("course", "title category");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    const isOwner = quiz.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (isOwner || isAdmin) {
      return res.status(200).json({
        success: true,
        quiz
      });
    }

    // Student view
    if (!quiz.isPublished) {
      return res.status(403).json({
        success: false,
        message: "This quiz is not currently published"
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course._id || quiz.course,
      status: { $in: ["active", "completed"] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course"
      });
    }

    // Strip out correct answers for students
    const studentQuiz = quiz.toObject();
    studentQuiz.questions = studentQuiz.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    return res.status(200).json({
      success: true,
      quiz: studentQuiz
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= START QUIZ SESSION =================
const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Published quiz not found"
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: { $in: ["active", "completed"] }
    });

    if (!enrollment && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course"
      });
    }

    let attempt = await QuizAttempt.findOne({
      student: req.user._id,
      quiz: quizId
    });

    if (attempt && attempt.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "You have already completed this quiz",
        attempt
      });
    }

    if (!attempt) {
      attempt = await QuizAttempt.create({
        student: req.user._id,
        quiz: quizId,
        status: "in-progress",
        startedAt: new Date()
      });
    }

    const durationSeconds = (quiz.duration || 30) * 60;
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    return res.status(200).json({
      success: true,
      message: "Quiz session active",
      startedAt: attempt.startedAt,
      duration: quiz.duration,
      remainingSeconds
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= SUBMIT QUIZ =================
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const { quizId } = req.params;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array"
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Published quiz not found"
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: { $in: ["active", "completed"] }
    });

    if (!enrollment && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course"
      });
    }

    let attempt = await QuizAttempt.findOne({
      student: req.user._id,
      quiz: quizId
    });

    if (attempt && attempt.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "You have already completed this quiz"
      });
    }

    // Server-side timer validation with 90s grace window for network lag
    if (attempt && attempt.startedAt) {
      const allowedTimeMs = ((quiz.duration || 30) * 60 + 90) * 1000;
      const elapsedTimeMs = Date.now() - new Date(attempt.startedAt).getTime();

      // Reject only if submitted excessively late (e.g. over 2 minutes beyond deadline)
      if (elapsedTimeMs > allowedTimeMs + 120000) {
        return res.status(400).json({
          success: false,
          message: "Quiz time limit has expired. Submission rejected."
        });
      }
    }

    // Build map of submitted answers: questionIndex -> selectedAnswer
    const answerMap = new Map();
    answers.forEach((ans) => {
      if (ans && typeof ans.questionIndex === "number") {
        answerMap.set(ans.questionIndex, ans.selectedAnswer);
      }
    });

    let score = 0;
    const evaluatedAnswers = [];

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      let selectedAnswer = answerMap.has(i) ? answerMap.get(i) : -1;

      // Normalize missing or unanswered values to -1
      if (
        selectedAnswer === null ||
        selectedAnswer === undefined ||
        selectedAnswer === "" ||
        selectedAnswer < 0
      ) {
        selectedAnswer = -1;
      }

      // If answered, ensure it is within bounds
      if (
        selectedAnswer !== -1 &&
        (!Number.isInteger(selectedAnswer) || selectedAnswer >= question.options.length)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid option selected for question ${i + 1}`
        });
      }

      const isCorrect = selectedAnswer !== -1 && selectedAnswer === question.correctAnswer;

      if (isCorrect) {
        score += question.marks || 1;
      }

      evaluatedAnswers.push({
        questionIndex: i,
        selectedAnswer,
        isCorrect
      });
    }

    const percentage = quiz.totalMarks > 0
      ? Number(((score / quiz.totalMarks) * 100).toFixed(2))
      : 0;

    const passed = score >= quiz.passingMarks;

    if (attempt) {
      attempt.answers = evaluatedAnswers;
      attempt.score = score;
      attempt.totalMarks = quiz.totalMarks;
      attempt.percentage = percentage;
      attempt.passed = passed;
      attempt.status = "completed";
      attempt.submittedAt = new Date();
      await attempt.save();
    } else {
      attempt = await QuizAttempt.create({
        student: req.user._id,
        quiz: quizId,
        answers: evaluatedAnswers,
        score,
        totalMarks: quiz.totalMarks,
        percentage,
        passed,
        status: "completed",
        startedAt: new Date(),
        submittedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      result: {
        score,
        totalMarks: quiz.totalMarks,
        percentage,
        passed,
        attemptId: attempt._id
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= MY QUIZ RESULTS (STUDENT) =================
const getMyQuizResults = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      student: req.user._id,
      status: "completed"
    })
      .populate("quiz", "title totalMarks passingMarks duration")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET INSTRUCTOR'S QUIZZES =================
const getInstructorQuizzes = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { instructor: req.user._id };

    const quizzes = await Quiz.find(filter)
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    const quizIds = quizzes.map((q) => q._id);

    const attemptCounts = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds }, status: "completed" } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } }
    ]);

    const countMap = new Map();
    attemptCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const enrichedQuizzes = quizzes.map((quiz) => ({
      ...quiz.toObject(),
      attemptsCount: countMap.get(quiz._id.toString()) || 0
    }));

    return res.status(200).json({
      success: true,
      count: enrichedQuizzes.length,
      quizzes: enrichedQuizzes
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= UPDATE QUIZ =================
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    if (
      quiz.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quiz"
      });
    }

    const {
      title,
      description,
      questions,
      passingMarks,
      duration,
      isPublished
    } = req.body;

    if (title) quiz.title = title.trim();
    if (description !== undefined) quiz.description = description;
    if (duration !== undefined) quiz.duration = Number(duration) || 30;
    if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);

    if (questions && Array.isArray(questions)) {
      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Quiz must have at least one question"
        });
      }

      for (const question of questions) {
        if (
          !question.questionText ||
          !Array.isArray(question.options) ||
          question.options.length < 2 ||
          !Number.isInteger(question.correctAnswer) ||
          question.correctAnswer < 0 ||
          question.correctAnswer >= question.options.length
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid question or answer options"
          });
        }
      }

      quiz.questions = questions;
      quiz.totalMarks = questions.reduce(
        (total, question) => total + (question.marks || 1),
        0
      );
    }

    if (passingMarks !== undefined) {
      const pass = Number(passingMarks) || 0;
      if (pass < 0 || pass > quiz.totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Passing marks cannot exceed total marks"
        });
      }
      quiz.passingMarks = pass;
    }

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= DELETE QUIZ =================
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    if (
      quiz.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quiz"
      });
    }

    // Clean up attempts
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Quiz and related attempts deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= GET QUIZ ATTEMPTS (INSTRUCTOR/ADMIN) =================
const getQuizAttempts = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("course", "title");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    if (
      quiz.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attempts for this quiz"
      });
    }

    const attempts = await QuizAttempt.find({
      quiz: quiz._id,
      status: "completed"
    })
      .populate("student", "name email avatar")
      .sort({ score: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attempts.length,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        courseTitle: quiz.course?.title || "Course",
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        duration: quiz.duration
      },
      attempts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================= PUBLISH / UNPUBLISH QUIZ =================
const publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      quiz.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage this quiz"
      });
    }

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();

    return res.status(200).json({
      success: true,
      message: quiz.isPublished
        ? "Quiz published successfully"
        : "Quiz unpublished successfully",
      quiz
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
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
};