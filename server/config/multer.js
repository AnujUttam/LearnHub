const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  }
});

// Video filter (up to 100MB)
const videoFileFilter = (req, file, cb) => {
  const allowedMimes = ["video/mp4", "video/webm", "video/ogg", "video/x-matroska", "video/quicktime"];
  if (file.mimetype.startsWith("video/") || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (MP4, WebM, MKV, MOV) are allowed"), false);
  }
};

// Image filter (up to 5MB)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (file.mimetype.startsWith("image/") || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

upload.image = uploadImage;
upload.video = upload;

module.exports = upload;