const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "INR"
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true
    },

    razorpayPaymentId: {
      type: String,
      default: ""
    },

    razorpaySignature: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);