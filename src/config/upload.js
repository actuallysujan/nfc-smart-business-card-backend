const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_GALLERY_FILES = 10;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|webp)$/i;

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const createStorage = (folder) => {
  if (isCloudinaryConfigured()) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `nfc-smart-business-card/${folder}`,
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation:
          folder === "profiles"
            ? [{ width: 500, height: 500, crop: "limit" }]
            : [{ width: 1600, height: 1600, crop: "limit" }],
      },
    });
  }

  const targetDir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(targetDir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(targetDir, { recursive: true });
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const prefix = folder === "profiles" ? "profile" : "image";
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  const hasValidMime = ALLOWED_MIME_TYPES.has(file.mimetype);
  const hasValidExt = ALLOWED_EXTENSIONS.test(file.originalname);

  if (hasValidMime && hasValidExt) {
    return cb(null, true);
  }

  const err = new Error(
    "Only image files (jpeg, jpg, png, gif, webp) are allowed"
  );
  err.statusCode = 400;
  return cb(err);
};

const createUploader = (folder) =>
  multer({
    storage: createStorage(folder),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: imageFileFilter,
  });

const profileUploader = createUploader("profiles").fields([
  { name: "profileImage", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

const galleryUploader = createUploader("images").fields([
  { name: "images", maxCount: MAX_GALLERY_FILES },
  { name: "image", maxCount: MAX_GALLERY_FILES },
]);

/**
 * Middleware to parse a single profile picture from `profileImage` or `image`.
 * When `optional` is true, non-multipart requests pass straight through.
 */
const handleProfileUpload = (optional = false) => (req, res, next) => {
  if (optional && !req.is("multipart/form-data")) {
    return next();
  }

  profileUploader(req, res, (err) => {
    if (err) return next(err);

    const file =
      req.files?.profileImage?.[0] || req.files?.image?.[0] || req.file || null;
    if (file) {
      req.file = file;
    }
    return next();
  });
};

/**
 * Middleware to parse one or more gallery images from `images` or `image`.
 */
const handleGalleryUpload = (req, res, next) => {
  galleryUploader(req, res, (err) => {
    if (err) return next(err);

    const files = [
      ...(req.files?.images || []),
      ...(req.files?.image || []),
    ];
    req.uploadedImages = files;
    return next();
  });
};

/**
 * Normalizes a Multer/Cloudinary file object into `{ url, publicId }`.
 */
const extractUploadedFile = (file, folder) => {
  if (!file) return null;

  if (isCloudinaryConfigured() && /^https?:\/\//i.test(file.path || "")) {
    return {
      url: file.path,
      publicId: file.filename || "",
    };
  }

  return {
    url: `/uploads/${folder}/${file.filename}`,
    publicId: `${folder}/${file.filename}`,
  };
};

/**
 * Safely deletes a previously stored image from Cloudinary or local disk.
 */
const deleteStoredImage = async (publicId, url = "") => {
  if (!publicId && !url) return;

  if (isCloudinaryConfigured() && publicId && /^https?:\/\//i.test(url)) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      // Log and continue so DB state isn't blocked by remote cleanup failure
      console.error("Cloudinary cleanup error:", err.message);
    }
    return;
  }

  const relativePath =
    publicId ||
    (url.startsWith("/uploads/") ? url.slice("/uploads/".length) : "");

  if (!relativePath) return;

  const resolvedPath = path.resolve(UPLOADS_ROOT, relativePath);
  if (!resolvedPath.startsWith(UPLOADS_ROOT + path.sep)) {
    return;
  }

  try {
    await fs.promises.unlink(resolvedPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Local file cleanup error:", err.message);
    }
  }
};

module.exports = {
  UPLOADS_ROOT,
  MAX_FILE_SIZE_BYTES,
  MAX_GALLERY_FILES,
  uploadProfilePicture: handleProfileUpload(false),
  uploadOptionalProfilePicture: handleProfileUpload(true),
  uploadGalleryImages: handleGalleryUpload,
  extractUploadedFile,
  deleteStoredImage,
};
