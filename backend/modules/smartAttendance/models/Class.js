import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false },
);

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    section: { type: String, trim: true, default: "" },
    department: { type: String, trim: true },
    assignments: [assignmentSchema],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// This ensures a class is only "Duplicate" if NAME, SECTION, AND SEMESTER match exactly.
classSchema.index({ name: 1, section: 1, semester: 1 }, { unique: true });

export default mongoose.model("Class", classSchema);
