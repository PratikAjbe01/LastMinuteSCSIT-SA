// modules/smartAttendance/socket/socketHandler.js
import crypto            from "crypto";
import { Server }        from "socket.io";
import AttendanceSession from "../models/AttendanceSession.js";

const QR_INTERVAL_MS  = 5000;
const TOKEN_EXPIRY_MS = 6000; // 1s grace

let _io = null;
export const getIO = () => _io;

const sessionIntervals  = new Map(); // sessionId → QR interval
const sessionAutoEndMap = new Map(); // sessionId → auto-end timeout

// ── Stop QR rotation ──────────────────────────────────────────────────────────
export const stopSessionInterval = (sessionId) => {
  const key = String(sessionId);
  if (sessionIntervals.has(key)) {
    clearInterval(sessionIntervals.get(key));
    sessionIntervals.delete(key);
    console.log(`[Socket] QR interval stopped → ${sessionId}`);
  }
};

// ── Clear auto-end timer ──────────────────────────────────────────────────────
export const clearAutoEnd = (sessionId) => {
  const key = String(sessionId);
  if (sessionAutoEndMap.has(key)) {
    clearTimeout(sessionAutoEndMap.get(key));
    sessionAutoEndMap.delete(key);
    console.log(`[Socket] Auto-end timer cleared → ${sessionId}`);
  }
};

// ── Refresh + broadcast QR token ──────────────────────────────────────────────
const refreshQRToken = async (io, sessionId) => {
  try {
    const token     = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await AttendanceSession.findByIdAndUpdate(sessionId, {
      currentToken:   token,
      tokenExpiresAt: expiresAt,
    });

    io.to(`session-${sessionId}`).emit("qr-refresh", {
      sessionId,
      qrToken:   token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error(`[Socket] refreshQRToken error → ${sessionId}:`, err.message);
    stopSessionInterval(sessionId);
  }
};

// ── Start 5s QR loop ──────────────────────────────────────────────────────────
const startSessionInterval = (io, sessionId) => {
  const key = String(sessionId);
  if (sessionIntervals.has(key)) return; // already running

  refreshQRToken(io, sessionId); // immediate first token

  const interval = setInterval(() => refreshQRToken(io, sessionId), QR_INTERVAL_MS);
  sessionIntervals.set(key, interval);
  console.log(`[Socket] QR loop started → ${sessionId}`);
};

// ── Schedule auto-end ─────────────────────────────────────────────────────────
export const scheduleAutoEnd = (io, sessionId, durationMinutes) => {
  clearAutoEnd(sessionId); // clear any previous timer
  if (!durationMinutes || durationMinutes <= 0) return;

  const ms = durationMinutes * 60 * 1000;

  const timeout = setTimeout(async () => {
    try {
      console.log(`[Socket] Auto-ending session → ${sessionId}`);

      const session = await AttendanceSession.findById(sessionId);
      if (!session || session.status !== 'active') return;

      session.status   = 'completed';
      session.endTime  = new Date();
      session.currentToken   = null;
      session.tokenExpiresAt = null;
      session.activityLog.push({
        action:    'SESSION_AUTO_ENDED',
        actor:     'system',
        detail:    `Session auto-ended after ${durationMinutes} minute(s)`,
        timestamp: new Date(),
      });
      await session.save();

      stopSessionInterval(sessionId);
      sessionAutoEndMap.delete(String(sessionId));

      // Notify all clients in the room
      io.to(`session-${sessionId}`).emit('session-auto-ended', {
        sessionId,
        message: `Session automatically ended after ${durationMinutes} minute(s).`,
        endedAt: new Date().toISOString(),
      });

      console.log(`[Socket] Session auto-ended → ${sessionId}`);
    } catch (err) {
      console.error(`[Socket] auto-end error → ${sessionId}:`, err.message);
    }
  }, ms);

  sessionAutoEndMap.set(String(sessionId), timeout);
  console.log(`[Socket] Auto-end scheduled → ${sessionId} in ${durationMinutes}min`);
};

// ── Log activity ──────────────────────────────────────────────────────────────
const logActivity = async (sessionId, entry) => {
  try {
    await AttendanceSession.findByIdAndUpdate(sessionId, {
      $push: { activityLog: { ...entry, timestamp: new Date() } },
    });
  } catch (err) {
    console.error("[Socket] logActivity error:", err.message);
  }
};

// ── Main init ─────────────────────────────────────────────────────────────────
export const initSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      allowedOrigins,
      methods:     ["GET", "POST"],
      credentials: true,
    },
    transports:   ["websocket", "polling"],
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  _io = io;

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Faculty joins session room ──────────────────────────────────────────
    socket.on("join-session", async ({ sessionId } = {}) => {
      if (!sessionId) return;
      try {
        const session = await AttendanceSession.findById(sessionId)
          .populate("attendees.student", "name rollNumber");

        if (!session) {
          socket.emit("session-error", { message: "Session not found" });
          return;
        }
        if (session.status !== "active") {
          socket.emit("session-error", { message: "Session is no longer active" });
          return;
        }

        socket.join(`session-${sessionId}`);
        console.log(`[Socket] Faculty joined → session-${sessionId}`);

        const attendees = session.attendees.map((a) => ({
          studentId:  a.student?._id?.toString(),
          name:       a.student?.name       || "Unknown",
          rollNumber: a.student?.rollNumber || "—",
          ipAddress:  a.ipAddress           || "—",
          time: a.markedAt?.toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true,
          }),
        }));

        // Calculate remaining time if session has a duration
        let remainingSeconds = null;
        if (session.scheduledEndAt) {
          remainingSeconds = Math.max(
            0,
            Math.floor((new Date(session.scheduledEndAt) - Date.now()) / 1000)
          );
        }

        socket.emit("session-joined", {
          sessionId,
          attendees,
          maxAttendees:     session.maxAttendees    ?? null,
          allowedSubnet:    session.allowedSubnet   ?? null,
          facultyPublicIP:  session.facultyPublicIP ?? null,
          activityLog:      session.activityLog     || [],
          durationMinutes:  session.durationMinutes ?? null,
          scheduledEndAt:   session.scheduledEndAt  ?? null,
          remainingSeconds,
        });

        // If interval already running, emit current token immediately to this socket
        if (sessionIntervals.has(String(sessionId)) && session.currentToken) {
          socket.emit("qr-refresh", {
            sessionId,
            qrToken:   session.currentToken,
            expiresAt: session.tokenExpiresAt?.toISOString(),
          });
        }

        startSessionInterval(io, sessionId);

        // Re-schedule auto-end if session has one and timer isn't running
        if (
          session.scheduledEndAt &&
          !sessionAutoEndMap.has(String(sessionId)) &&
          new Date(session.scheduledEndAt) > new Date()
        ) {
          const remaining = new Date(session.scheduledEndAt) - Date.now();
          const remainingMins = remaining / 60000;
          scheduleAutoEnd(io, sessionId, remainingMins);
        }

      } catch (err) {
        console.error("[Socket] join-session error:", err.message);
        socket.emit("session-error", { message: "Failed to join session" });
      }
    });

    // ── Student watches session ─────────────────────────────────────────────
    socket.on("watch-session", async ({ sessionId } = {}) => {
      if (!sessionId) return;
      try {
        const session = await AttendanceSession.findById(sessionId)
          .select("status currentToken tokenExpiresAt");

        if (!session || session.status !== "active") {
          socket.emit("session-error", { message: "Session not found or inactive" });
          return;
        }

        socket.join(`session-${sessionId}`);

        if (session.currentToken && new Date() < new Date(session.tokenExpiresAt)) {
          socket.emit("qr-refresh", {
            sessionId,
            qrToken:   session.currentToken,
            expiresAt: session.tokenExpiresAt?.toISOString(),
          });
        }
      } catch (err) {
        console.error("[Socket] watch-session error:", err.message);
      }
    });

    // ── Faculty: update duration live ───────────────────────────────────────
    socket.on("update-duration", async ({ sessionId, durationMinutes } = {}) => {
      if (!sessionId) return;
      try {
        const mins = parseInt(durationMinutes) || null;
        const scheduledEndAt = mins
          ? new Date(Date.now() + mins * 60 * 1000)
          : null;

        await AttendanceSession.findByIdAndUpdate(sessionId, {
          durationMinutes: mins,
          scheduledEndAt,
        });

        await logActivity(sessionId, {
          action: "DURATION_UPDATED",
          actor:  "faculty",
          detail: mins
            ? `Duration set to ${mins} minute(s). Auto-ends at ${scheduledEndAt?.toLocaleTimeString()}`
            : "Duration removed — session runs indefinitely",
        });

        // Reset auto-end timer
        if (mins) {
          scheduleAutoEnd(io, sessionId, mins);
        } else {
          clearAutoEnd(sessionId);
        }

        io.to(`session-${sessionId}`).emit("duration-updated", {
          sessionId,
          durationMinutes: mins,
          scheduledEndAt:  scheduledEndAt?.toISOString() ?? null,
        });

      } catch (err) {
        console.error("[Socket] update-duration error:", err.message);
      }
    });

    // ── Faculty: update threshold ───────────────────────────────────────────
    socket.on("set-threshold", async ({ sessionId, maxAttendees } = {}) => {
      if (!sessionId) return;
      try {
        const max = maxAttendees ? parseInt(maxAttendees) : null;
        await AttendanceSession.findByIdAndUpdate(sessionId, { maxAttendees: max });
        await logActivity(sessionId, {
          action: "THRESHOLD_UPDATED",
          actor:  "faculty",
          detail: max ? `Max set to ${max}` : "Threshold removed",
        });
        io.to(`session-${sessionId}`).emit("threshold-updated", { sessionId, maxAttendees: max });
      } catch (err) {
        console.error("[Socket] set-threshold error:", err.message);
      }
    });

    // ── Faculty: remove student ─────────────────────────────────────────────
    socket.on("remove-student", async ({ sessionId, studentId, facultyId } = {}) => {
      if (!sessionId || !studentId) return;
      try {
        await AttendanceSession.findByIdAndUpdate(sessionId, {
          $pull: { attendees: { student: studentId } },
        });
        await logActivity(sessionId, {
          action:  "STUDENT_REMOVED",
          actor:   "faculty",
          actorId: facultyId,
          detail:  `Student ${studentId} removed`,
        });
        io.to(`session-${sessionId}`).emit("student-removed", { sessionId, studentId });
      } catch (err) {
        console.error("[Socket] remove-student error:", err.message);
      }
    });

    // ── Faculty: manually add student ──────────────────────────────────────
    socket.on("add-student", async ({ sessionId, studentId, facultyId } = {}) => {
      if (!sessionId || !studentId) return;
      try {
        const session = await AttendanceSession.findById(sessionId);
        const already = session?.attendees.some(
          (a) => a.student.toString() === studentId
        );
        if (already) {
          socket.emit("session-error", { message: "Student already marked" });
          return;
        }

        const markedAt = new Date();
        await AttendanceSession.findByIdAndUpdate(sessionId, {
          $push: { attendees: { student: studentId, markedAt, ipAddress: "manual" } },
        });

        const { User } = await import("../../../models/user.model.js");
        const student  = await User.findById(studentId).select("name rollNumber");

        await logActivity(sessionId, {
          action:  "STUDENT_ADDED",
          actor:   "faculty",
          actorId: facultyId,
          detail:  `${student?.name || studentId} added manually`,
        });

        io.to(`session-${sessionId}`).emit("attendance-marked", {
          studentId,
          name:       student?.name       || "Unknown",
          rollNumber: student?.rollNumber || "—",
          ipAddress:  "manual",
          time:       markedAt.toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true,
          }),
        });
      } catch (err) {
        console.error("[Socket] add-student error:", err.message);
      }
    });

    socket.on("stop-session", ({ sessionId } = {}) => {
      if (!sessionId) return;
      stopSessionInterval(sessionId);
      clearAutoEnd(sessionId);
      io.to(`session-${sessionId}`).emit("session-stopped", { sessionId });
    });

    socket.on("leave-session", ({ sessionId } = {}) => {
      if (sessionId) socket.leave(`session-${sessionId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} — ${reason}`);
    });
  });

  console.log("[Socket] Socket.IO initialized");
  return io;
};