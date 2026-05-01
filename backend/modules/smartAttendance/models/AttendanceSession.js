// modules/smartAttendance/models/AttendanceSession.js
import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema(
  {
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    markedAt:  { type: Date, default: Date.now },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    action:    { type: String, required: true },
    actor:     { type: String, required: true },
    actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    detail:    { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    faculty:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    subject:         { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class:           { type: mongoose.Schema.Types.ObjectId, ref: 'Class',   required: true },
    date:            { type: String,  required: true },
    startTime:       { type: Date,    default: Date.now },
    endTime:         { type: Date },
    status:          { type: String,  enum: ['active', 'completed'], default: 'active' },
    attendees:       [attendeeSchema],
    activityLog:     [activityLogSchema],

    // QR rotation — every 5s
    currentToken:    { type: String,  default: null },
    tokenExpiresAt:  { type: Date,    default: null },

    // Threshold — max students allowed
    maxAttendees:    { type: Number,  default: null },

    // IP subnet of faculty — students must match
    allowedSubnet:   { type: String,  default: null },
    facultyPublicIP: { type: String,  default: null },

    // Session duration in minutes — auto-ends when elapsed
    durationMinutes: { type: Number,  default: null }, // null = no auto-end
    scheduledEndAt:  { type: Date,    default: null },
  },
  { timestamps: true }
);

export default mongoose.model('AttendanceSession', sessionSchema);