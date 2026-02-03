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
  try {
    const users = await authService.getAllUsers();

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
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
