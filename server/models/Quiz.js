
const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    questions: [
      {
        questionText: {
          type: String,
          required: true
        },

        options: {
          type: [String],
          validate: {
            validator: (options) => options.length >= 2,
            message: "At least two options are required"
          }
        },

        correctAnswer: {
          type: Number,
          required: true,
          min: 0
        },

        marks: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],

    totalMarks: {
      type: Number,
      default: 0
    },

    passingMarks: {
      type: Number,
      default: 0
    },

    duration: {
      type: Number,
      default: 30
    },

    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
