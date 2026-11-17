const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("Error: MONGO_URI is missing in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin provisioning.");

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log(`Admin account already provisioned: ${existingAdmin.email} (${existingAdmin.name})`);
      process.exit(0);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@learnhub.com").toLowerCase();
    const adminName = process.env.ADMIN_NAME || "LearnHub Administrator";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@LearnHub2026!";

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      isVerified: true
    });

    console.log("==========================================");
    console.log("    ADMIN ACCOUNT SUCCESSFULLY SEEDED");
    console.log("==========================================");
    console.log(`Email:    ${newAdmin.email}`);
    console.log(`Role:     ${newAdmin.role}`);
    console.log(`Password: ${adminPassword}`);
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();