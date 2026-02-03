const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { protect } = require("../../middlewares/auth.middleware");

/* ================= PUBLIC ROUTES ================= */

router.post("/login", authController.login);
router.post("/register/super-admin", authController.registerSuperAdmin);

/* ================= PROTECTED ROUTES ================= */

router.post(
  "/register/user",
  protect(["SUPER_ADMIN"]),
  authController.registerUser
);

router.get(
  "/users",
  protect(["SUPER_ADMIN", "ADMIN"]),
  authController.getAllUsers
);

router.get(
  "/profile",
  protect(["SUPER_ADMIN", "ADMIN", "USER"]),
  authController.getOwnProfile
);

module.exports = router;
