const authService = require("./auth.service");

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
    res.status(400).json({ message: error.message });
  }
};

const registerSuperAdmin = async (req, res) => {
  try {
    const user = await authService.registerSuperAdmin(req.body);
    res.status(201).json({
      message: "Super admin created",
      userId: user._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================= PROTECTED ================= */

// TEMP minimal handlers (so routes don’t crash)
const registerUser = async (req, res) => {
  res.json({ message: "registerUser working" });
};

const getAllUsers = async (req, res) => {
  res.json({ message: "getAllUsers working" });
};

const getOwnProfile = async (req, res) => {
  res.json({ message: "getOwnProfile working" });
};

module.exports = {
  login,
  registerSuperAdmin,
  registerUser,
  getAllUsers,
  getOwnProfile,
};
