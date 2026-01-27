const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { upload } = require("../config/cloudinary"); 
const { protect, checkPermission } = require("../middleware/auth.middleware");

// ========== PUBLIC ROUTES (No Authentication Required) ==========

// Initial SUPER_ADMIN registration (for first-time setup only)
// You should disable this in production after creating the first super admin
router.post("/register/super-admin", authController.registerSuperAdmin);

// Login route - anyone can attempt to login
router.post("/login", authController.login);

// ========== PROTECTED ROUTES (Authentication Required) ==========

// Only SUPER_ADMIN can register new users to the organization
router.post(
  "/register/user",
  protect(["SUPER_ADMIN"]),
  authController.registerUser
);

// SUPER_ADMIN can promote a USER to ADMIN
router.patch(
  "/users/:userId/promote-to-admin",
  protect(["SUPER_ADMIN"]),
  authController.promoteToAdmin
);

// SUPER_ADMIN can demote an ADMIN to USER
router.patch(
  "/users/:userId/demote-to-user",
  protect(["SUPER_ADMIN"]),
  authController.demoteToUser
);

// Both SUPER_ADMIN and ADMIN can view all users
router.get(
  "/users",
  protect(["SUPER_ADMIN", "ADMIN"]),
  authController.getAllUsers
);

// Both SUPER_ADMIN and ADMIN can view a specific user
router.get(
  "/users/:userId",
  protect(["SUPER_ADMIN", "ADMIN"]),
  authController.getUserById
);

// Users can view their own profile
router.get(
  "/profile",
  protect(["SUPER_ADMIN", "ADMIN", "USER"]),
  authController.getOwnProfile
);

// Update user profile with image
router.put(
  "/users/:id",
  authMiddleware,
  upload.single("profileImage"), // "profileImage" is the field name
  authController.updateUserProfile
);
// Users can update their own profile (name, password, etc.)
router.patch(
  "/profile",
  protect(["SUPER_ADMIN", "ADMIN", "USER"]),
  authController.updateOwnProfile
);

// SUPER_ADMIN can deactivate users
router.patch(
  "/users/:userId/deactivate",
  protect(["SUPER_ADMIN"]),
  authController.deactivateUser
);

// SUPER_ADMIN can activate users
router.patch(
  "/users/:userId/activate",
  protect(["SUPER_ADMIN"]),
  authController.activateUser
);

// SUPER_ADMIN can delete users permanently (use with caution)
router.delete(
  "/users/:userId",
  protect(["SUPER_ADMIN"]),
  authController.deleteUser
);

module.exports = router;