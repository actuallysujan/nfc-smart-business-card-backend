const authService = require("./auth.service");
const logger = require("../../config/logger");

///Logger==>>>
exports.login = async (req, res) => {
  try {
    logger.info("Login attempt", { email: req.body.email });

    res.status(200).json({ message: "Login success" });
  } catch (error) {
    logger.error("Login failed", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ================= PUBLIC ================= */
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json({
      message: "Login successful",
      token: result.token,
      user: {
        userId: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const registerSuperAdmin = async (req, res) => {
  try {
    const user = await authService.registerSuperAdmin(req.body);
    res.status(201).json({
      message: "Super admin created successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================= PROTECTED (SUPER_ADMIN ONLY) ================= */

const registerUser = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body, req.user._id);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const promoteToAdmin = async (req, res) => {
  try {
    const user = await authService.promoteToAdmin(req.params.userId);
    res.json({
      message: "User promoted to ADMIN successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const demoteToUser = async (req, res) => {
  try {
    const user = await authService.demoteToUser(req.params.userId);
    res.json({
      message: "User demoted to USER successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================= PROTECTED (SUPER_ADMIN & ADMIN) ================= */

const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();

    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.userId);
    
    res.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await authService.deactivateUser(req.params.userId, req.user._id);
    res.json({
      message: "User deactivated successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await authService.activateUser(req.params.userId);
    res.json({
      message: "User activated successfully",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await authService.deleteUser(req.params.userId, req.user._id);
    res.json({
      message: "User deleted permanently",
      deletedUser: {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================= PROTECTED (ALL AUTHENTICATED USERS) ================= */

const getOwnProfile = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user._id);
    
    res.json({
      message: "Profile retrieved successfully",
      user: {
        userId: user._id,
        fullName: user.name,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        permanentAddress: user.permanentAddress,
        profileImage: user.profileImage,
        role: user.role,
        currentPosition: user.currentPosition,
        experience: user.experience,
        education: user.education,
        isActive: user.isActive,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateOwnProfile = async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 CONTROLLER - updateOwnProfile called');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 req.user:', req.user);
    console.log('📍 req.user._id:', req.user?._id);
    console.log('📍 req.body:', req.body);
    console.log('📍 Content-Type:', req.headers['content-type']);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.log('❌ No user found in request');
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if body has data
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ Empty request body');
      return res.status(400).json({ message: "No data provided" });
    }
    
    const user = await authService.updateOwnProfile(req.user._id, req.body);
    
    console.log('✅ CONTROLLER - Update successful');
    console.log('📦 Updated user:', user);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.json({
      message: "Profile updated successfully",
      user: {
        userId: user._id,
        fullName: user.name,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        permanentAddress: user.permanentAddress,
        profileImage: user.profileImage,
        role: user.role,
        currentPosition: user.currentPosition,
        experience: user.experience,
        education: user.education,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ CONTROLLER ERROR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  // Public
  login,
  registerSuperAdmin,
  
  // Super Admin only
  registerUser,
  promoteToAdmin,
  demoteToUser,
  
  // Super Admin & Admin
  getAllUsers,
  getUserById,
  deactivateUser,
  activateUser,
  deleteUser,
  
  // All authenticated
  getOwnProfile,
  updateOwnProfile, 
};