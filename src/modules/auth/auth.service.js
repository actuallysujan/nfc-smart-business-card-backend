const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("./auth.repository");

const login = async ({ email, password }) => {
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

const registerSuperAdmin = async (data) => {
  const existing = await authRepo.findByEmail(data.email);
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(data.password, 10);

  return authRepo.createUser({
    ...data,
    password: hashed,
    role: "SUPER_ADMIN",
  });
};

const registerUser = async (data, createdByUserId) => {
  const { name, email, password, role } = data;

  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  const allowedRoles = ["USER", "ADMIN"];
  if (role && !allowedRoles.includes(role)) {
    throw new Error("Invalid role. Only USER or ADMIN roles can be assigned.");
  }

  const existing = await authRepo.findByEmail(email);
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  return authRepo.createUser({
    name,
    email,
    password: hashed,
    role: role || "USER",
    createdBy: createdByUserId,
  });
};

const getAllUsers = async () => {
  const users = await authRepo.findAllUsers();

  const formattedUsers = users.map(user => ({
    id: user._id,
    name: user.name,
    lastName: user.lastName || "",
    email: user.email,
    phone: user.mobileNumber || "Not provided",
    address: user.permanentAddress || "Not provided",
    profileImage: user.profileImage || null,
    joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : "N/A",
    status: user.isActive ? "Active" : "Inactive",
    role: user.role,
    currentPosition: user.currentPosition,
    experience: user.experience || [],
    education: user.education || [],
    createdBy: user.createdBy ? {
      name: user.createdBy.name,
      email: user.createdBy.email
    } : null,
  }));

  return formattedUsers;
};

const getUserById = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");
  return user;
};

const promoteToAdmin = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Cannot modify super admin role");
  }

  if (user.role === "ADMIN") {
    throw new Error("User is already an admin");
  }

  return authRepo.updateUserRole(userId, "ADMIN");
};

const demoteToUser = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Cannot modify super admin role");
  }

  if (user.role === "USER") {
    throw new Error("User already has USER role");
  }

  return authRepo.updateUserRole(userId, "USER");
};

const deactivateUser = async (userId, currentUserId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Cannot deactivate super admin account");
  }

  if (user._id.toString() === currentUserId.toString()) {
    throw new Error("Cannot deactivate your own account");
  }

  return authRepo.updateUserStatus(userId, false);
};

const activateUser = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  return authRepo.updateUserStatus(userId, true);
};

const deleteUser = async (userId, currentUserId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Cannot delete super admin account");
  }

  if (user._id.toString() === currentUserId.toString()) {
    throw new Error("Cannot delete your own account");
  }

  return authRepo.deleteUser(userId);
};

const updateOwnProfile = async (userId, data = {}) => {
  const {
    name,
    lastName,
    mobileNumber,
    permanentAddress,
    currentPosition,
    experience,
    education,
  } = data;

  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  // Update fields
  if (name !== undefined) user.name = name;
  if (lastName !== undefined) user.lastName = lastName;
  if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
  if (permanentAddress !== undefined) user.permanentAddress = permanentAddress;
  if (currentPosition !== undefined) user.currentPosition = currentPosition;

  if (experience !== undefined) {
    if (!Array.isArray(experience)) {
      throw new Error("Experience must be an array");
    }
    user.experience = experience;
  }

  if (education !== undefined) {
    if (!Array.isArray(education)) {
      throw new Error("Education must be an array");
    }
    user.education = education;
  }

  await user.save();
  return user;
};

module.exports = {
  login,
  registerSuperAdmin,
  registerUser,
  getAllUsers,
  getUserById,
  promoteToAdmin,
  demoteToUser,
  deactivateUser,
  activateUser,
  deleteUser,
  updateOwnProfile, 
};