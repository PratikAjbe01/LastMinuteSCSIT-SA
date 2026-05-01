import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Crucial: Prevent a student from marking attendance twice in the same session
attendanceRecordSchema.index({ student: 1, session: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);