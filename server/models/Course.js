
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: [true, "Description is required"]
    },

    category: {
      type: String,
      required: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      default: 0,
      min: 0
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lessons: [
      {
        title: String,
        videoUrl: String,
        duration: Number,
        isPreview: {
          type: Boolean,
          default: false
        }
      }
    ],

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    isPublished: {
      type: Boolean,
      default: false
    },

    totalDuration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Course", courseSchema);
