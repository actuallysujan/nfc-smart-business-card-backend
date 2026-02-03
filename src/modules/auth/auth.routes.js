const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { protect } = require("../../middlewares/auth.middleware"); // ✅ Import protect

/* ================= PUBLIC ROUTES ================= */
router.post("/register-super-admin", authController.registerSuperAdmin);
router.post("/login", authController.login);

/* ================= PROTECTED ROUTES (SUPER_ADMIN ONLY) ================= */
router.post("/register-user", protect(["SUPER_ADMIN"]), authController.registerUser);
router.put("/users/:userId/promote", protect(["SUPER_ADMIN"]), authController.promoteToAdmin);
router.put("/users/:userId/demote", protect(["SUPER_ADMIN"]), authController.demoteToUser);

/* ================= PROTECTED ROUTES (SUPER_ADMIN & ADMIN) ================= */
router.get("/users", protect(["SUPER_ADMIN", "ADMIN"]), authController.getAllUsers);
router.get("/users/:userId", protect(["SUPER_ADMIN", "ADMIN"]), authController.getUserById);
router.put("/users/:userId/deactivate", protect(["SUPER_ADMIN", "ADMIN"]), authController.deactivateUser);
router.put("/users/:userId/activate", protect(["SUPER_ADMIN", "ADMIN"]), authController.activateUser);
router.delete("/users/:userId", protect(["SUPER_ADMIN", "ADMIN"]), authController.deleteUser);

/* ================= PROTECTED ROUTES (ALL AUTHENTICATED USERS) ================= */
router.get("/profile", protect(), authController.getOwnProfile);

module.exports = router;