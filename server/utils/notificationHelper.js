const Notification = require("../models/Notification");

const createNotification = async ({ recipient, title, message, type = "system", link = "" }) => {
  try {
    if (!recipient) return null;
    return await Notification.create({
      recipient,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

const notifyMany = async (recipients, { title, message, type = "system", link = "" }) => {
  try {
    if (!recipients || !recipients.length) return;
    const notifications = recipients.map((recipient) => ({
      recipient,
      title,
      message,
      type,
      link
    }));
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Failed to notify users:", error.message);
    return null;
  }
};

module.exports = {
  createNotification,
  notifyMany
};