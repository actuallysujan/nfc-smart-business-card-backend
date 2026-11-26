const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const requestLogger = require("./middlewares/logger.middleware");

const authRoutes = require("./modules/auth/auth.routes");

const app = express();

/* ================== GLOBAL MIDDLEWARES ================== */

// Enable CORS
app.use(cors());

// Request logging (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ✅ MOVE BODY PARSERS BEFORE requestLogger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ NOW add requestLogger AFTER body parsers
app.use(requestLogger);

/* ================== ROUTES ================== */

// API versioning
app.use("/api/v1/auth", authRoutes);

// Static files
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

/* ================== 404 HANDLER ================== */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================== GLOBAL ERROR HANDLER ================== */
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds 5MB limit"
        : err.message;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;