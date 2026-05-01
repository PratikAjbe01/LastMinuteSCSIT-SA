// src/features/smart-attendance/controllers/attendance.controller.js
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLedger  from '../models/AttendanceLedger.js';
import { User }          from '../../../models/user.model.js';
import { getIO }         from '../socket/socketHandler.js';

// ── IP helpers ───────────────────────────────────────────────────────────────
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
};

const getSubnet = (ip) => {
  // Handle IPv6-mapped IPv4 (::ffff:192.168.1.x)
  const clean = ip.replace(/^::ffff:/, '');
  const parts = clean.split('.');
  if (parts.length === 4) return parts.slice(0, 3).join('.');
  return null;
};

const isIPAllowed = (studentIP, allowedSubnet) => {
  if (!allowedSubnet) return true; // No restriction set
  const studentSubnet = getSubnet(studentIP);
  if (!studentSubnet) return false;
  return studentSubnet === allowedSubnet;
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/smart-attendance/attendance/mark
// body: { sessionId, qrToken }
// ────────────────────────────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, qrToken } = req.body;
    const studentId              = req.user._id;

    if (!sessionId || !qrToken)
      return res.status(400).json({
        success: false,
        message: 'sessionId and qrToken are required',
      });

    const session = await AttendanceSession.findById(sessionId)
      .populate('subject', 'name code')
      .populate('class',   'name students');

    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.status !== 'active')
      return res.status(400).json({
        success: false,
        message: 'This session has already ended',
      });

    // ── 1. QR token validation ───────────────────────────────────────────────
    if (!session.currentToken || session.currentToken !== qrToken)
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code. Please scan the latest QR shown on screen.',
      });

    if (!session.tokenExpiresAt || new Date() > new Date(session.tokenExpiresAt))
      return res.status(400).json({
        success: false,
        message: 'QR code has expired. Wait for the next 5-second refresh.',
      });

    // ── 2. IP subnet validation ──────────────────────────────────────────────
    const studentIP = getClientIP(req);
    if (!isIPAllowed(studentIP, session.allowedSubnet)) {
      await AttendanceSession.findByIdAndUpdate(sessionId, {
        $push: {
          activityLog: {
            action:    'IP_BLOCKED',
            actor:     'system',
            actorId:   studentId,
            detail:    `IP ${studentIP} blocked — not in subnet ${session.allowedSubnet}`,
            timestamp: new Date(),
          },
        },
      });
      return res.status(403).json({
        success: false,
        message: `Access denied. Connect to the authorized network (subnet: ${session.allowedSubnet}).`,
      });
    }

    // ── 3. Enrollment check ──────────────────────────────────────────────────
    const isEnrolled = session.class?.students?.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isEnrolled)
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class',
      });

    // ── 4. Duplicate check ───────────────────────────────────────────────────
    const alreadyMarked = session.attendees.some(
      (a) => a.student.toString() === studentId.toString()
    );
    if (alreadyMarked)
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session',
      });

    // ── 5. Threshold check ───────────────────────────────────────────────────
    if (
      session.maxAttendees !== null &&
      session.maxAttendees !== undefined &&
      session.attendees.length >= session.maxAttendees
    ) {
      await AttendanceSession.findByIdAndUpdate(sessionId, {
        $push: {
          activityLog: {
            action:    'THRESHOLD_EXCEEDED',
            actor:     'system',
            actorId:   studentId,
            detail:    `Attendance full (${session.maxAttendees}/${session.maxAttendees})`,
            timestamp: new Date(),
          },
        },
      });
      return res.status(403).json({
        success: false,
        message: `Attendance is full. Maximum ${session.maxAttendees} students allowed.`,
      });
    }

    // ── 6. Mark attendance ───────────────────────────────────────────────────
    const markedAt  = new Date();
    const userAgent = req.headers['user-agent'] || '';

    session.attendees.push({
      student:   studentId,
      markedAt,
      ipAddress: studentIP,
      userAgent,
    });

    session.activityLog.push({
      action:    'ATTENDANCE_MARKED',
      actor:     'student',
      actorId:   studentId,
      detail:    `Marked from IP ${studentIP}`,
      timestamp: markedAt,
    });

    await session.save();

    // ── 7. Update ledger ─────────────────────────────────────────────────────
    await AttendanceLedger.findOneAndUpdate(
      {
        student: studentId,
        subject: session.subject._id,
        class:   session.class._id,
      },
      {
        $inc:         { attended: 1 },
        $setOnInsert: { totalClasses: 0 },
      },
      { upsert: true, new: true }
    );

    // ── 8. Broadcast to faculty ──────────────────────────────────────────────
    const student = await User.findById(studentId).select('name rollNumber');
    const io      = getIO();

    if (io) {
      io.to(`session-${sessionId}`).emit('attendance-marked', {
        studentId:  studentId.toString(),
        name:       student?.name       || '—',
        rollNumber: student?.rollNumber || '—',
        ipAddress:  studentIP,
        time:       markedAt.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true,
        }),
      });

      // Also broadcast updated count
      io.to(`session-${sessionId}`).emit('session-stats', {
        sessionId,
        attendeeCount: session.attendees.length,
        maxAttendees:  session.maxAttendees,
      });
    }

    return res.json({
      success: true,
      message: 'Attendance marked successfully!',
    });
  } catch (err) {
    console.error('[markAttendance]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};