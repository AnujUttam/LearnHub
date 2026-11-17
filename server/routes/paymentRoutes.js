const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments
} = require("../controllers/paymentController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Student: Initiate order
router.post(
  "/create-order",
  protect,
  authorize("student", "admin"),
  createOrder
);

// Student: Verify Razorpay payment
router.post(
  "/verify",
  protect,
  authorize("student", "admin"),
  verifyPayment
);

// Student: Payment history
router.get(
  "/my-payments",
  protect,
  authorize("student", "admin"),
  getMyPayments
);

// Admin: Platform payment history & revenue
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  getAllPayments
);

module.exports = router;