const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Existing basic fields
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: { type: String, maxlength: 500 },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "USER"],
      default: "USER",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // New profile fields
    lastName: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    permanentAddress: {
      type: String,
      default: "",
    },
    currentPosition: {
      type: String,
      default: "",
    },
    
    // Experience array
    experience: [
      {
        company: {
          type: String,
          required: true,
        },
        position: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        description: {
          type: String,
        },
        isCurrent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    
    // Education array
    education: [
      {
        institution: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        fieldOfStudy: {
          type: String,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        description: {
          type: String,
        },
      },
    ],
    
    // Track who created this user (for SUPER_ADMIN tracking)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);