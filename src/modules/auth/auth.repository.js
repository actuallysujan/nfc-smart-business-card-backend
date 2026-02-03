const User = require("../../models/user.model");

exports.findByEmail = (email) => {
  return User.findOne({ email });
};

exports.findById = (id) => {
  return User.findById(id);
};

exports.createUser = (data) => {
  return User.create(data);
};

exports.getAllUsers = () => {
  return User.find()
    .select("-password")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

const findAllUsers = async () => {
  return await User.find().select("-password");
};

module.exports = {
  findAllUsers,
};
