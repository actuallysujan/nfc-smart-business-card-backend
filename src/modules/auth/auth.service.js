const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authRepo = require("./auth.repository");
const {
  extractUploadedFile,
  deleteStoredImage,
} = require("../../config/upload");

const formatImages = (images = []) =>
  images.map((img) => ({
    _id: img._id,
    url: img.url,
    caption: img.caption || "",
    uploadedAt: img.uploadedAt,
  }));

const parseArrayField = (value, fieldName) => {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} must be a valid JSON array`);
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be an array`);
  }
  return parsed;
};

const parseCaptions = (captionsInput) => {
  if (Array.isArray(captionsInput)) return captionsInput;
  if (typeof captionsInput === "string") {
    try {
      const parsed = JSON.parse(captionsInput);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Treat plain string as a single caption applied to uploaded images
    }
    return [captionsInput];
  }
  return [];
};

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
    bio: user.bio,
    phone: user.mobileNumber || "Not provided",
    address: user.permanentAddress || "Not provided",
    joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : "N/A",
    status: user.isActive ? "Active" : "Inactive",
    role: user.role,
    currentPosition: user.currentPosition,
    profileImage: user.profileImage || "",
    images: formatImages(user.images),
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

  const deletedUser = await authRepo.deleteUser(userId);

  await deleteStoredImage(user.profileImagePublicId, user.profileImage);
  if (Array.isArray(user.images) && user.images.length > 0) {
    await Promise.all(
      user.images.map((img) => deleteStoredImage(img.publicId, img.url))
    );
  }

  return deletedUser;
};

const updateOwnProfile = async (userId, data = {}, file = null) => {
  const {
    name,
    lastName,
    bio,
    mobileNumber,
    permanentAddress,
    currentPosition,
    experience,
    education,
  } = data;

  // Build update object with only provided fields
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
  if (permanentAddress !== undefined) updateData.permanentAddress = permanentAddress;
  if (currentPosition !== undefined) updateData.currentPosition = currentPosition;

  if (experience !== undefined) {
    updateData.experience = parseArrayField(experience, "Experience");
  }

  if (education !== undefined) {
    updateData.education = parseArrayField(education, "Education");
  }

  let previousProfilePublicId = "";
  let previousProfileImage = "";
  let uploadedProfile = null;

  if (file) {
    uploadedProfile = extractUploadedFile(file, "profiles");
    const existingUser = await authRepo.findById(userId);
    if (!existingUser) {
      await deleteStoredImage(uploadedProfile.publicId, uploadedProfile.url);
      throw new Error("User not found");
    }
    previousProfilePublicId = existingUser.profileImagePublicId || "";
    previousProfileImage = existingUser.profileImage || "";
    updateData.profileImage = uploadedProfile.url;
    updateData.profileImagePublicId = uploadedProfile.publicId;
  }

  // Use the repository method for update
  let user;
  try {
    user = await authRepo.updateUserProfile(userId, updateData);
  } catch (err) {
    if (uploadedProfile) {
      await deleteStoredImage(uploadedProfile.publicId, uploadedProfile.url);
    }
    throw err;
  }

  if (!user) {
    if (uploadedProfile) {
      await deleteStoredImage(uploadedProfile.publicId, uploadedProfile.url);
    }
    throw new Error("User not found");
  }

  if (
    uploadedProfile &&
    (previousProfilePublicId || previousProfileImage) &&
    previousProfilePublicId !== uploadedProfile.publicId
  ) {
    await deleteStoredImage(previousProfilePublicId, previousProfileImage);
  }

  return user;
};

const updateProfilePicture = async (userId, file) => {
  if (!file) {
    throw new Error("Profile picture file is required");
  }
  return updateOwnProfile(userId, {}, file);
};

const deleteProfilePicture = async (userId) => {
  const existingUser = await authRepo.findById(userId);
  if (!existingUser) throw new Error("User not found");

  const previousProfilePublicId = existingUser.profileImagePublicId || "";
  const previousProfileImage = existingUser.profileImage || "";

  const user = await authRepo.updateUserProfile(userId, {
    profileImage: "",
    profileImagePublicId: "",
  });

  await deleteStoredImage(previousProfilePublicId, previousProfileImage);

  return user;
};

const getOwnImages = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new Error("User not found");

  return {
    profileImage: user.profileImage || "",
    images: formatImages(user.images),
  };
};

const addImages = async (userId, files = [], captionsInput) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("At least one image file is required");
  }

  const captions = parseCaptions(captionsInput);
  const uploadedDocs = files.map((file, index) => {
    const { url, publicId } = extractUploadedFile(file, "images");
    const caption =
      captions[index] !== undefined
        ? String(captions[index]).trim()
        : captions.length === 1
          ? String(captions[0]).trim()
          : "";

    return {
      url,
      publicId,
      caption,
    };
  });

  let user;
  try {
    user = await authRepo.addUserImages(userId, uploadedDocs);
  } catch (err) {
    await Promise.all(
      uploadedDocs.map((img) => deleteStoredImage(img.publicId, img.url))
    );
    throw err;
  }

  if (!user) {
    await Promise.all(
      uploadedDocs.map((img) => deleteStoredImage(img.publicId, img.url))
    );
    throw new Error("User not found");
  }

  return {
    user,
    images: formatImages(user.images),
  };
};

const updateImageCaption = async (userId, imageId, caption) => {
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    throw new Error("Invalid image ID");
  }
  if (typeof caption !== "string") {
    throw new Error("Caption must be a string");
  }

  const user = await authRepo.updateUserImageCaption(
    userId,
    imageId,
    caption.trim()
  );
  if (!user) throw new Error("Image not found");

  return formatImages(user.images);
};

const deleteImage = async (userId, imageId) => {
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    throw new Error("Invalid image ID");
  }

  const existingUser = await authRepo.findById(userId);
  if (!existingUser) throw new Error("User not found");

  const targetImage = existingUser.images?.id(imageId);
  if (!targetImage) throw new Error("Image not found");

  const updatedUser = await authRepo.removeUserImage(userId, imageId);
  await deleteStoredImage(targetImage.publicId, targetImage.url);

  return formatImages(updatedUser.images);
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
  updateProfilePicture,
  deleteProfilePicture,
  getOwnImages,
  addImages,
  updateImageCaption,
  deleteImage,
  formatImages,
};