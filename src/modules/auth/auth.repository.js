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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟣 REPOSITORY - updateUserProfile called');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 userId:', userId);
  console.log('📍 updateData:', JSON.stringify(updateData, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('🔄 Executing findByIdAndUpdate...');
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("createdBy", "name email");
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ REPOSITORY - Database update successful');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Updated user from DB:');
    console.log('  - _id:', updatedUser?._id);
    console.log('  - name:', updatedUser?.name);
    console.log('  - lastName:', updatedUser?.lastName);
    console.log('  - mobileNumber:', updatedUser?.mobileNumber);
    console.log('  - permanentAddress:', updatedUser?.permanentAddress);
    console.log('  - currentPosition:', updatedUser?.currentPosition);
    console.log('  - updatedAt:', updatedUser?.updatedAt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return updatedUser;
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ REPOSITORY ERROR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    throw error;
  }
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