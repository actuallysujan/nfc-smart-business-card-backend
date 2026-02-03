const User = require("../../models/user.model");

const findByEmail = (email) => {
  return User.findOne({ email });
};

const findById = (id) => {
  return User.findById(id)
    .select("-password")
    .populate("createdBy", "name email");
};

const createUser = (data) => {
  return User.create(data);
};

const findAllUsers = () => {
  return User.find()
    .select("-password")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

const updateUserRole = async (userId, role) => {
  const user = await User.findById(userId);
  user.role = role;
  await user.save();
  return user;
};

const updateUserStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  user.isActive = isActive;
  await user.save();
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  await user.deleteOne();
  return user;
};

const updateUserProfile = async (userId, updateData) => {
  return User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .select("-password")
    .populate("createdBy", "name email");
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  findAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  updateUserProfile,
};