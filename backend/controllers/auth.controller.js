import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendAdminLoginOtpEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const signup = async (req, res) => {
  const { email, password, name, role, rollNumber, department, course, semester } = req.body;

  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword      = await bcryptjs.hash(password, 10);
    const verificationToken   = Math.floor(100000 + Math.random() * 900000).toString();

    const userData = {
      email,
      password:     hashedPassword,
      name,
      role:         role || "student",
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    // Role-specific fields
    if (role === "student") {
      if (rollNumber)  userData.rollNumber  = String(rollNumber).trim().toUpperCase();
      if (department)  userData.department  = String(department).trim();
      if (course)      userData.course      = String(course).trim().toUpperCase();
      if (semester !== undefined && semester !== "") {
        const sem = parseInt(semester, 10);
        if (!isNaN(sem) && sem >= 0) userData.semester = sem;
      }
    }

    if (role === "faculty") {
      if (department) userData.department = String(department).trim();
    }

    const user  = new User(userData);
    await user.save();

    const token = generateTokenAndSetCookie(res, user);
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        course:     user.course,
        semester:   user.semester,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);
    const token = generateTokenAndSetCookie(res, user);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "student",
      },
    });
  } catch (error) {
    console.log("error in verifyEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendVerifyEmail = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user?.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    if (!user?.verificationToken) {
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationToken = verificationToken;
      user.verificationTokenExpiresAt = Date.now() + 10 * 60 * 1000;
      await user.save();
    }

    await sendVerificationEmail(user?.email, user?.verificationToken || verificationToken);

    res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.log("error in sendVerifyEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Email!" });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid Password!" });
    }

    if (user?.isAdmin === "admin" && role !== "admin") {
      return res.status(403).json({ success: false, message: "Admins are required to check the box!" });
    }

    if (user?.isAdmin !== "admin" && role === "admin") {
      return res.status(403).json({ success: false, message: "You are not authorized to access this admin resource." });
    }

    if (user?.isAdmin === "admin" && user?.isAdmin) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationToken = otp;
      user.verificationTokenExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      await sendAdminLoginOtpEmail(user?.email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email.",
        user: user,
      });
    }

    const token = generateTokenAndSetCookie(res, user);

    user.lastLogin = new Date();
    await user.save();

    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || (user.isAdmin === "admin" ? "admin" : "student"),
        department: user.department,
        rollNumber: user.rollNumber,
        course: user.course,
        semester: user.semester,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log("Error in login controller: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyAdminOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({
      email: email,
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user || !user.isAdmin) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }

    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateTokenAndSetCookie(res, user);

    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Admin verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
        department: user.department,
        rollNumber: user.rollNumber,
        course: user.course,
        semester: user.semester,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log("Error in verifyAdminOtp controller: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

    res.status(200).json({ success: true, message: "Password reset link sent to your email" });
  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { username, course, semester, profileurl,  } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID is missing." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.name = username || user.name;
    user.course = course || user.course;
    user.semester = semester || user.semester;
    if (profileurl) user.profileUrl = profileurl;

    await user.save({ validateModifiedOnly: true });

    const savedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: savedUser,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.log("Error in updateProfile controller: ", error);
    return res.status(500).json({ success: false, message: "Server error while updating profile." });
  }
};

export const fetchUser = async (req, res) => {
  const userId = req.params.userId || req.body.userId;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in fetchUser controller: ", error);
    return res.status(500).json({ success: false, message: "Server error while fetching user." });
  }
};

export const fetchAllUser = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isAdmin, isVerified, department, course, semester } = req.query;

    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));

    // ── Filter builder ────────────────────────────────────────────────────
    const filter = {};

    // Role field (student | faculty | admin)
    if (role && ["student", "faculty", "admin"].includes(role)) {
      filter.role = role;
    }

    // isAdmin field (user | admin) — separate from role
    if (isAdmin && ["user", "admin"].includes(isAdmin)) {
      filter.isAdmin = isAdmin;
    }

    // isVerified boolean
    if (isVerified !== undefined && isVerified !== "") {
      filter.isVerified = isVerified === "true";
    }

    // Department, course, semester
    if (department) filter.department = { $regex: department, $options: "i" };
    if (course) filter.course = { $regex: course, $options: "i" };
    if (semester) filter.semester = Number(semester);

    // Full-text search across name, email, rollNumber
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { rollNumber: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      User.countDocuments(filter),
    ]);

    // ── Aggregate stats (always full collection, ignoring current filter) ─
    const [statsResult] = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: { $sum: { $cond: [{ $eq: ["$isAdmin", "admin"] }, 1, 0] } },
          verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
          unverified: { $sum: { $cond: ["$isVerified", 0, 1] } },
          students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
          faculty: { $sum: { $cond: [{ $eq: ["$role", "faculty"] }, 1, 0] } },
          regular: { $sum: { $cond: [{ $eq: ["$isAdmin", "user"] }, 1, 0] } },
        },
      },
    ]);

    const stats = statsResult
      ? {
          total: statsResult.total,
          admins: statsResult.admins,
          regular: statsResult.regular,
          verified: statsResult.verified,
          unverified: statsResult.unverified,
          students: statsResult.students,
          faculty: statsResult.faculty,
        }
      : { total: 0, admins: 0, regular: 0, verified: 0, unverified: 0, students: 0, faculty: 0 };

    return res.status(200).json({
      success: true,
      users,
      stats,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
        hasNext: p * l < total,
        hasPrev: p > 1,
      },
    });
  } catch (error) {
    console.error("Error in fetchAllUser controller:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching users." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Failed to delete user", error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const {
      userId,
      name, email,
      rollNumber, department, course, semester, profileUrl,
      isVerified, isAdmin, role,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name      !== undefined) user.name  = name.trim();
    if (email     !== undefined) user.email = email.trim().toLowerCase();

    if (rollNumber !== undefined) {
      const roll = String(rollNumber).trim();
      if (roll !== "") {
        if (!/^[A-Za-z0-9/_-]{2,20}$/.test(roll)) {
          return res.status(400).json({
            success: false,
            message: "Invalid roll number. Use 2–20 alphanumeric characters (/, -, _ allowed).",
          });
        }
        user.rollNumber = roll.toUpperCase();
      } else {
        user.rollNumber = "";
      }
    }

    if (department !== undefined) {
      const dept = String(department).trim();
      if (dept.length > 100) {
        return res.status(400).json({ success: false, message: "Department name is too long." });
      }
      user.department = dept;
    }

    if (course !== undefined) user.course = String(course).trim().toUpperCase();

    if (semester !== undefined) {
      const sem = parseInt(semester, 10);
      if (isNaN(sem) || sem < 0) {
        return res.status(400).json({ success: false, message: "Invalid semester value." });
      }
      user.semester = sem;
    }

    if (profileUrl !== undefined) {
      const url = String(profileUrl).trim();
      if (url !== "" && !/^https?:\/\/.+/.test(url)) {
        return res.status(400).json({
          success: false,
          message: "Profile URL must start with http:// or https://",
        });
      }
      user.profileUrl = url;
    }

    if (isAdmin    !== undefined && ["user", "admin"].includes(isAdmin)) user.isAdmin = isAdmin;
    if (role       !== undefined && ["student", "faculty", "admin"].includes(role)) user.role = role;
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);

    await user.save();
    const updated = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user:    updated,
    });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ success: false, message: "Failed to update user", error: err.message });
  }
};

export const addOpenedFile = async (req, res) => {
  try {
    const { fileId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    if (!fileId || typeof fileId !== "string") {
      return res.status(400).json({ success: false, message: "A valid file ID is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const updatedOpenedFiles = user.openedFiles.filter((id) => id !== fileId);
    updatedOpenedFiles.unshift(fileId);

    user.openedFiles = updatedOpenedFiles;

    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "File added to recent files successfully.",
    });
  } catch (error) {
    console.error("Error in addOpenedFile controller: ", error);
    return res.status(500).json({ success: false, message: "Server error while updating recent files." });
  }
};
