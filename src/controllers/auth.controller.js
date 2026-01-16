const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ========== PUBLIC CONTROLLERS ==========

// First-time SUPER_ADMIN registration (use only once, then disable)
exports.registerSuperAdmin = async (req, res) => {
  try {
    // Check if any super admin already exists
    // const existingSuperAdmin = await User.findOne({ role: "SUPER_ADMIN" });
    // if (existingSuperAdmin) {
    //   return res.status(400).json({
    //     message: "Super admin already exists. This endpoint is disabled.",
    //   });
    // }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    });

    res.status(201).json({
      message: "Super admin created successfully",
      user: {
        userId: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN - Anyone can login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact admin." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PROTECTED CONTROLLERS (SUPER_ADMIN ONLY) ==========

// SUPER_ADMIN registers new users (ADMIN or USER)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role - only ADMIN or USER can be created
    const allowedRoles = ["USER", "ADMIN"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Only USER or ADMIN roles can be assigned.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "USER", // Default to USER if no role specified
      createdBy: req.user.userId, // Track who created this user
    });

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
    res.status(500).json({ error: error.message });
  }
};

// SUPER_ADMIN promotes USER to ADMIN
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot modify super admin
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ 
        message: "Cannot modify super admin role" 
      });
    }

    // Already an admin
    if (user.role === "ADMIN") {
      return res.status(400).json({ 
        message: "User is already an admin" 
      });
    }

    user.role = "ADMIN";
    await user.save();

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
    res.status(500).json({ error: error.message });
  }
};

// SUPER_ADMIN demotes ADMIN to USER
exports.demoteToUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot modify super admin
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ 
        message: "Cannot modify super admin role" 
      });
    }

    // Already a user
    if (user.role === "USER") {
      return res.status(400).json({ 
        message: "User already has USER role" 
      });
    }

    user.role = "USER";
    await user.save();

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
    res.status(500).json({ error: error.message });
  }
};

// ========== PROTECTED CONTROLLERS (SUPER_ADMIN & ADMIN) ==========

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Users retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password")
      .populate("createdBy", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== PROTECTED CONTROLLERS (ALL AUTHENTICATED USERS) ==========

// Get own profile with complete information
exports.getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("createdBy", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile retrieved successfully",
      user: {
        userId: user._id,
        // Basic info
        fullName: user.name,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        permanentAddress: user.permanentAddress,
        
        // Professional info
        role: user.role,
        currentPosition: user.currentPosition,
        
        // Experience and Education
        experience: user.experience,
        education: user.education,
        
        // System fields
        isActive: user.isActive,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update own profile with extended fields
exports.updateOwnProfile = async (req, res) => {
  try {
    const {
      name,
      lastName,
      mobileNumber,
      permanentAddress,
      currentPosition,
      experience,
      education,
      // password,
      // currentPassword
    } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating password, verify current password first
    // if (password) {
    //   if (!currentPassword) {
    //     return res.status(400).json({ 
    //       message: "Current password is required to change password" 
    //     });
    //   }

    //   const isMatch = await bcrypt.compare(currentPassword, user.password);
    //   if (!isMatch) {
    //     return res.status(401).json({ 
    //       message: "Current password is incorrect" 
    //     });
    //   }

    //   user.password = await bcrypt.hash(password, 10);
    // }

    // Update basic information
    if (name !== undefined) user.name = name;
    if (lastName !== undefined) user.lastName = lastName;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
    if (permanentAddress !== undefined) user.permanentAddress = permanentAddress;
    if (currentPosition !== undefined) user.currentPosition = currentPosition;
    
    // Update experience if provided
    if (experience !== undefined) {
      // Validate experience array
      if (!Array.isArray(experience)) {
        return res.status(400).json({ 
          message: "Experience must be an array" 
        });
      }
      user.experience = experience;
    }
    
    // Update education if provided
    if (education !== undefined) {
      // Validate education array
      if (!Array.isArray(education)) {
        return res.status(400).json({ 
          message: "Education must be an array" 
        });
      }
      user.education = education;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        userId: user._id,
        fullName: user.name,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        permanentAddress: user.permanentAddress,
        role: user.role,
        currentPosition: user.currentPosition,
        experience: user.experience,
        education: user.education,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deactivate user account
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot deactivate super admin
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ 
        message: "Cannot deactivate super admin account" 
      });
    }

    // Cannot deactivate yourself
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        message: "Cannot deactivate your own account" 
      });
    }

    user.isActive = false;
    await user.save();

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
    res.status(500).json({ error: error.message });
  }
};

// Activate user account
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

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
    res.status(500).json({ error: error.message });
  }
};

// Delete user permanently (use with caution)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot delete super admin
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ 
        message: "Cannot delete super admin account" 
      });
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        message: "Cannot delete your own account" 
      });
    }

    await user.deleteOne();

    res.json({
      message: "User deleted permanently",
      deletedUser: {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;