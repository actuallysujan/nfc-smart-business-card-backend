const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("./auth.repository");

exports.login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  if (!user.isActive) {
    throw new Error("Account deactivated");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user };
};

exports.registerSuperAdmin = async (data) => {
  const existing = await authRepo.findByEmail(data.email);
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(data.password, 10);

  return authRepo.createUser({
    ...data,
    password: hashed,
    role: "SUPER_ADMIN",
  });
};
