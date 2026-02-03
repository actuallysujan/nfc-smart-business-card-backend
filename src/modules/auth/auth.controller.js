const authService = require("./auth.service");

exports.login = async (req, res) => {
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

exports.registerSuperAdmin = async (req, res) => {
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
