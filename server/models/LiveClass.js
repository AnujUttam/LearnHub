
const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
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

    roomName: {
      type: String,
      required: true,
      unique: true
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    duration: {
      type: Number,
      default: 60
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
