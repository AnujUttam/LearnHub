
const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true
    },

    answers: [
      {
        questionIndex: Number,
        selectedAnswer: Number,
        isCorrect: Boolean
      }
    ],

    score: {
      type: Number,
      default: 0
    },

    totalMarks: {
      type: Number,
      default: 0
    },

    percentage: {
      type: Number,
      default: 0
    },

    passed: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "completed"
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    submittedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

quizAttemptSchema.index({ student: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
