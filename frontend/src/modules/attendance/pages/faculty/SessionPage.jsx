// src/features/smart-attendance/pages/faculty/SessionPage.jsx
// CHANGE: Remove auto-redirect, show fallback UI instead
// ADD: Resume active session flow

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2, Minimize2, ArrowLeft, Trash2, Wifi, WifiOff, Clock,
  CheckCircle, RefreshCw, AlertTriangle, Download, UserPlus, Settings,
  Activity, Shield, Users, Timer, ChevronDown, ChevronUp, Search,
  PlayCircle, Home,
} from "lucide-react";
import useAttendanceStore from "../../store/attendanceStore";
import { useSocket } from "../../hooks/useSocket";
import { endAttendanceSession } from "../../services/attendanceService";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import SessionTimer from "../../components/SessionTimer";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../store/authStore";
import { formatDate } from "../../utils/helpers";
import { API_URL } from "../../../../utils/urls";

const API_BASE = `${API_URL}/api/smart-attendance`;
const buildHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ── No Session Fallback UI ────────────────────────────────────────────────────
const NoSessionFallback = ({ onResume, isResuming }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md overflow-hidden"
      >
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">No Active Session</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your session may have expired or wasn't found in this tab
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            There's no active session loaded. You can try to{" "}
            <strong>resume</strong> an existing session from the server, or
            start a new one.
          </p>
          <div className="space-y-3">
            <button
              onClick={onResume}
              disabled={isResuming}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {isResuming ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Checking for active session...</>
              ) : (
                <><PlayCircle className="w-4 h-4" /> Resume Active Session</>
              )}
            </button>
            <button
              onClick={() => navigate("/smart/faculty/start-attendance")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" /> Start a New Session
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── End Session Modal ─────────────────────────────────────────────────────────
const EndSessionModal = ({ isOpen, onClose, onConfirm, isEnding, count }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
      >
        <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">End Session</h3>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            End this session and finalize attendance for{" "}
            <strong className="text-slate-800">
              {count} student{count !== 1 ? "s" : ""}
            </strong>.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isEnding}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isEnding ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Ending...</>
              ) : (
                "End Session"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DurationModal = ({ isOpen, onClose, current, scheduledEndAt, onSave }) => {
  const [value, setValue] = useState(current?.toString() || "");
  if (!isOpen) return null;
  const remaining = scheduledEndAt
    ? Math.max(0, Math.floor((new Date(scheduledEndAt) - Date.now()) / 60000))
    : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
      >
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Session Duration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {remaining !== null ? `~${remaining} min remaining` : "No auto-end set"}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Duration in minutes (from now)
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 30"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Leave empty to remove auto-end and run indefinitely.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(value ? parseInt(value) : null); onClose(); }}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Set Duration
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ThresholdModal = ({ isOpen, onClose, current, onSave }) => {
  const [value, setValue] = useState(current?.toString() || "");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
      >
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Attendance Threshold</h3>
            <p className="text-xs text-slate-500 mt-0.5">Limit total markings for this session</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
              Max Students (leave empty for unlimited)
            </label>
            <input
              type="number"
              min="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 60"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(value ? parseInt(value) : null); onClose(); }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FullscreenQR = ({ session, qrToken, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-8 p-8"
  >
    <div className="text-center">
      <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
        Live Attendance QR
      </p>
      <h2 className="text-4xl font-bold text-slate-800">{session.subjectName}</h2>
      <p className="text-slate-400 text-lg mt-1">{session.className}</p>
    </div>
    <div className="relative p-6 bg-white border-2 border-blue-100 rounded-3xl shadow-2xl shadow-blue-100">
      <div className="absolute -top-3 -left-3  w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
      <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
      <div className="absolute -bottom-3 -left-3  w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
      <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
      <QRCodeDisplay sessionId={session.sessionId} qrToken={qrToken} />
    </div>
    <p className="text-sm text-slate-400 font-medium">Rotates every 5 seconds · Proxy-proof</p>
    <button
      onClick={onClose}
      className="flex items-center gap-2 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors"
    >
      <Minimize2 className="w-4 h-4" /> Exit Fullscreen
    </button>
  </motion.div>
);

const ActivityPanel = ({ logs }) => {
  const iconMap = {
    ATTENDANCE_MARKED:  { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50" },
    STUDENT_REMOVED:    { icon: Trash2,         color: "text-red-500",     bg: "bg-red-50"     },
    STUDENT_ADDED:      { icon: UserPlus,       color: "text-blue-500",    bg: "bg-blue-50"    },
    THRESHOLD_UPDATED:  { icon: Settings,       color: "text-amber-500",   bg: "bg-amber-50"   },
    THRESHOLD_EXCEEDED: { icon: AlertTriangle,  color: "text-orange-500",  bg: "bg-orange-50"  },
    IP_BLOCKED:         { icon: Shield,         color: "text-red-600",     bg: "bg-red-50"     },
    SESSION_STARTED:    { icon: Activity,       color: "text-blue-600",    bg: "bg-blue-50"    },
  };
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {logs.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
      ) : (
        [...logs].reverse().map((log, i) => {
          const cfg  = iconMap[log.action] || { icon: Activity, color: "text-slate-400", bg: "bg-slate-50" };
          const Icon = cfg.icon;
          return (
            <div key={i} className="flex items-start gap-2.5 text-xs">
              <div className={`w-6 h-6 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={12} className={cfg.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-700 font-medium leading-tight truncate">
                  {log.detail || log.action}
                </p>
                <p className="text-slate-400 mt-0.5">
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                      })
                    : "—"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// ── Main SessionPage ──────────────────────────────────────────────────────────
const SessionPage = () => {
  const { token, user } = useAuthStore();
  const {
    currentSession, qrToken, attendanceList, setQrToken,
    addAttendanceRecord, removeAttendanceRecord, endSession,
    isSessionActive, startSession,
  } = useAttendanceStore();
  const navigate = useNavigate();
  const {
    connect, disconnect, joinSession, onQRUpdate, onAttendanceMarked,
    onSessionJoined, onStudentRemoved, onThresholdUpdated, onSessionStats,
    removeStudent: socketRemoveStudent, offAll,
  } = useSocket();

  const [ending, setEnding]               = useState(false);
  const [showEndModal, setShowEndModal]   = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [maxAttendees, setMaxAttendees]   = useState(null);
  const [activityLogs, setActivityLogs]   = useState([]);
  const [allowedSubnet, setAllowedSubnet] = useState(null);
  const [showActivity, setShowActivity]   = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [scheduledEndAt, setScheduledEndAt]   = useState(null);
  const [showDuration, setShowDuration]   = useState(false);

  // ── NEW: resume state ─────────────────────────────────────────────────────
  const [isResuming, setIsResuming] = useState(false);

  const initialized = useRef(false);

  // ── NEW: Resume active session from server ────────────────────────────────
  const handleResumeSession = useCallback(async () => {
    setIsResuming(true);
    try {
      const res = await fetch(`${API_BASE}/faculty/sessions?status=active&limit=1`, {
        headers: buildHeaders(token),
      });
      const data = await res.json();
      const active = data?.sessions?.[0];

      if (!active) {
        toast.error("No active session found on the server");
        return;
      }

      // Hydrate the store with the found session
      startSession({
        sessionId:   active._id,
        className:   active.class?.name
          ? `${active.class.name}${active.class.section ? " - " + active.class.section : ""}`
          : "Unknown Class",
        subjectName: active.subject?.name || "Unknown Subject",
        startTime:   active.startTime,
      });

      toast.success("Session resumed successfully!");
      // The socket useEffect will trigger once currentSession is set
    } catch {
      toast.error("Failed to resume session");
    } finally {
      setIsResuming(false);
    }
  }, [token, startSession]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSession?.sessionId || initialized.current) return;
    initialized.current = true;

    const socket = connect();

    socket.on("connect", () => {
      setSocketConnected(true);
      joinSession(currentSession.sessionId);
    });
    socket.on("reconnect", () => {
      setSocketConnected(true);
      joinSession(currentSession.sessionId);
    });
    socket.on("duration-updated", (data) => {
      setDurationMinutes(data.durationMinutes);
      setScheduledEndAt(data.scheduledEndAt);
    });
    socket.on("session-auto-ended", (data) => {
      toast.error(data.message || "Session auto-ended");
      endSession();
      navigate("/smart/faculty/dashboard");
    });
    socket.on("disconnect", () => setSocketConnected(false));

    onSessionJoined((data) => {
      if (data.attendees?.length) data.attendees.forEach((a) => addAttendanceRecord(a));
      setMaxAttendees(data.maxAttendees ?? null);
      setAllowedSubnet(data.allowedSubnet ?? null);
      setDurationMinutes(data.durationMinutes ?? null);
      setScheduledEndAt(data.scheduledEndAt ?? null);
      if (data.activityLog?.length) setActivityLogs(data.activityLog);
    });

    onQRUpdate((data) => {
      if (data?.qrToken) setQrToken(data.qrToken);
    });

    onAttendanceMarked((record) => {
      addAttendanceRecord(record);
      toast.success(`${record.name} marked present`, {
        icon: "✅", style: { fontSize: "13px" },
      });
      setActivityLogs((prev) => [
        ...prev,
        {
          action:    "ATTENDANCE_MARKED",
          actor:     "student",
          detail:    `${record.name} (${record.rollNumber}) — IP: ${record.ipAddress || "—"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    onStudentRemoved((data) => {
      removeAttendanceRecord(data.studentId);
      toast.success("Student removed from session");
    });

    onThresholdUpdated((data) => setMaxAttendees(data.maxAttendees));
    onSessionStats((data) => setMaxAttendees(data.maxAttendees));

    return () => {
      offAll();
      disconnect();
      initialized.current = false;
    };
  }, [currentSession?.sessionId]);

  // ── Threshold save ────────────────────────────────────────────────────────
  const handleThresholdSave = useCallback(async (max) => {
    try {
      const res  = await fetch(
        `${API_BASE}/faculty/sessions/${currentSession.sessionId}/threshold`,
        { method: "PATCH", headers: buildHeaders(token), body: JSON.stringify({ maxAttendees: max }) }
      );
      const data = await res.json();
      if (data.success) {
        setMaxAttendees(data.maxAttendees);
        toast.success(data.maxAttendees ? `Threshold set to ${data.maxAttendees} students` : "Threshold removed");
      }
    } catch {
      toast.error("Failed to update threshold");
    }
  }, [currentSession?.sessionId, token]);

  const handleDurationSave = async (mins) => {
    try {
      const res  = await fetch(
        `${API_BASE}/faculty/sessions/${currentSession.sessionId}/duration`,
        { method: "PATCH", headers: buildHeaders(token), body: JSON.stringify({ durationMinutes: mins }) }
      );
      const data = await res.json();
      if (data.success) {
        setDurationMinutes(mins);
        setScheduledEndAt(data.scheduledEndAt);
        toast.success(mins ? `Session ends in ${mins} min` : "Auto-end removed");
      }
    } catch {
      toast.error("Failed to update duration");
    }
  };

  // ── Remove student ────────────────────────────────────────────────────────
  const handleRemoveStudent = useCallback(async (studentId) => {
    if (!window.confirm("Remove this student from the session?")) return;
    try {
      const res  = await fetch(
        `${API_BASE}/faculty/sessions/${currentSession.sessionId}/attendees/${studentId}`,
        { method: "DELETE", headers: buildHeaders(token) }
      );
      const data = await res.json();
      if (data.success) {
        removeAttendanceRecord(studentId);
        socketRemoveStudent(currentSession.sessionId, studentId, user._id);
        toast.success("Attendance record removed");
      }
    } catch {
      toast.error("Failed to remove record");
    }
  }, [currentSession?.sessionId, token]);

  // ── End session ───────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    setEnding(true);
    try {
      await endAttendanceSession(currentSession.sessionId, token);
      endSession();
      toast.success("Session ended and records saved");
      navigate("/smart/faculty/dashboard");
    } catch {
      toast.error("Failed to end session");
    } finally {
      setEnding(false);
    }
  }, [currentSession?.sessionId, token]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const rows = [
      "Name,Roll Number,Time,IP Address",
      ...attendanceList.map(
        (s) => `"${s.name}","${s.rollNumber}","${s.time}","${s.ipAddress || "—"}"`
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `session_${currentSession.sessionId?.slice(-8)}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [attendanceList, currentSession?.sessionId]);

  // ── NEW: Show fallback instead of redirecting ─────────────────────────────
  if (!currentSession || !isSessionActive) {
    return (
      <NoSessionFallback
        onResume={handleResumeSession}
        isResuming={isResuming}
      />
    );
  }

  const isFull = maxAttendees !== null && attendanceList.length >= maxAttendees;

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/smart/faculty/dashboard")}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                {socketConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                    <WifiOff className="w-3 h-3" /> Reconnecting...
                  </span>
                )}
                {allowedSubnet && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                    <Shield className="w-3 h-3" /> Subnet: {allowedSubnet}.*
                  </span>
                )}
                {isFull && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                    <Users className="w-3 h-3" /> Session Full
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Live Session — {currentSession.className}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <SessionTimer startTime={currentSession.startTime} />
            </div>
            <button
              onClick={() => setShowThreshold(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              {maxAttendees ? `Limit: ${attendanceList.length}/${maxAttendees}` : "Set Limit"}
            </button>
            <button
              onClick={() => setShowDuration(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded-xl transition-all"
            >
              <Timer className="w-4 h-4" />
              {scheduledEndAt
                ? `Ends: ${new Date(scheduledEndAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Set Duration"}
            </button>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-5 py-2.5 bg-red-50 border border-red-200 hover:bg-red-600 hover:border-red-600 hover:text-white text-red-600 font-semibold text-sm rounded-xl transition-all"
            >
              End Session
            </button>
          </div>
        </div>

        {/* ── Info Bar ── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Class",   value: currentSession.className },
            { label: "Subject", value: currentSession.subjectName },
            { label: "Date",    value: formatDate(new Date()) },
            {
              label:     "Present",
              value:     maxAttendees
                ? `${attendanceList.length} / ${maxAttendees}`
                : `${attendanceList.length} students`,
              highlight: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm border ${
                item.highlight
                  ? isFull
                    ? "bg-orange-50 border-orange-100 text-orange-700"
                    : "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600"
              }`}
            >
              <span className="text-xs font-normal opacity-70">{item.label}:</span>
              {item.value}
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── QR Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-700 text-sm">QR Code Broadcaster</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rotates every 5 seconds · Token expires in 6s
                </p>
              </div>
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-xl text-xs font-semibold transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-8 min-h-[360px] gap-6">
              <AnimatePresence mode="wait">
                {qrToken ? (
                  <motion.div
                    key={qrToken}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative p-5 bg-white border-2 border-blue-100 rounded-2xl shadow-lg shadow-blue-50">
                      <div className="absolute -top-2 -left-2  w-6 h-6 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-md" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-md" />
                      <div className="absolute -bottom-2 -left-2  w-6 h-6 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-md" />
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-md" />
                      <QRCodeDisplay sessionId={currentSession.sessionId} qrToken={qrToken} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        Students scan with AttendEase app
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Session ID:{" "}
                        <span className="font-mono text-blue-500">
                          {currentSession.sessionId?.slice(-8)}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        {socketConnected ? "Generating QR code..." : "Connecting to server..."}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {socketConnected
                          ? "First token arrives in under a second"
                          : "Establishing secure socket connection"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Activity accordion */}
            <div className="border-t border-slate-100">
              <button
                onClick={() => setShowActivity((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Activity Log
                  <span className="text-xs font-normal text-slate-400">
                    ({activityLogs.length})
                  </span>
                </span>
                {showActivity
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {showActivity && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <ActivityPanel logs={activityLogs} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Attendance Log ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[640px]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-slate-700 text-sm">Live Entry Log</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time scan results</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                  isFull
                    ? "bg-orange-50 text-orange-700 border-orange-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {maxAttendees ? `${attendanceList.length}/${maxAttendees}` : attendanceList.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {attendanceList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <Wifi className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Waiting for scans...</p>
                    <p className="text-xs mt-1 opacity-70">Student entries appear here instantly</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {[...attendanceList].reverse().map((student, i) => (
                      <motion.div
                        key={student.studentId || i}
                        initial={{ opacity: 0, x: -12, backgroundColor: "#eff6ff" }}
                        animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                        transition={{ duration: 0.35 }}
                        className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">
                              {student.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-slate-400 font-mono">
                                {student.rollNumber}
                              </p>
                              {student.ipAddress && student.ipAddress !== "manual" && (
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                  {student.ipAddress}
                                </span>
                              )}
                              {student.ipAddress === "manual" && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                  Manual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs text-slate-400 font-medium">{student.time}</span>
                          <button
                            onClick={() => handleRemoveStudent(student.studentId)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {attendanceList.length > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 flex-shrink-0">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV (with IP)
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenQR
            session={currentSession}
            qrToken={qrToken}
            onClose={() => setIsFullscreen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEndModal && (
          <EndSessionModal
            isOpen={showEndModal}
            onClose={() => setShowEndModal(false)}
            onConfirm={handleEndSession}
            isEnding={ending}
            count={attendanceList.length}
          />
        )}
      </AnimatePresence>

      <ThresholdModal
        isOpen={showThreshold}
        onClose={() => setShowThreshold(false)}
        current={maxAttendees}
        onSave={handleThresholdSave}
      />

      <DurationModal
        isOpen={showDuration}
        onClose={() => setShowDuration(false)}
        current={durationMinutes}
        scheduledEndAt={scheduledEndAt}
        onSave={handleDurationSave}
      />
    </>
  );
};

export default SessionPage;