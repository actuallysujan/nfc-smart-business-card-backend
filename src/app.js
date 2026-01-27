const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

module.exports = app;
