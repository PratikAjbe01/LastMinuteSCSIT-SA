import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    code:       { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: String, trim: true },
    credits:    { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);