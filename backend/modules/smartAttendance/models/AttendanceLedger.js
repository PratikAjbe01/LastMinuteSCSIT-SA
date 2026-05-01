import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema(
  {
    student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    subject:      { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class:        { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
    attended:     { type: Number, default: 0, min: 0 },
    totalClasses: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Enforce one record per student-subject-class
ledgerSchema.index({ student: 1, subject: 1, class: 1 }, { unique: true });

export default mongoose.model('AttendanceLedger', ledgerSchema);