import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    course: {
      type: String,
    },
    semester: {
      type: Number,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileUrl: {
      type: String,
    },
    openedFiles: {
      type: [String],
      default: [],
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student",
    },
    department: {
      type: String,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    currentChallenge: { type: String }, // Temporary storage for the auth challenge
    passkeys: [
      {
        credentialID: String, // Unique ID for the fingerprint
        credentialPublicKey: Buffer, // The cryptographic public key
        counter: Number, // Prevents replay attacks
        transports: [String], // e.g., ["internal", "hybrid"]
      }
    ],

    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
