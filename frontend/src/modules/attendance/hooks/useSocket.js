// src/features/smart-attendance/hooks/useSocket.js
import { useRef, useCallback } from "react";
import { io }                  from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL    ||
  "https://lastminute-scsit-api.vercel.app";

// Module-level singleton — one socket for the entire app lifetime
let _socket = null;

export const useSocket = () => {
  const connect = useCallback(() => {
    // Return existing connected socket immediately
    if (_socket?.connected) return _socket;

    // If socket exists but disconnected — remove it and reconnect
    if (_socket && !_socket.connected) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }

    _socket = io(SOCKET_URL, {
      withCredentials: true,
      transports:      ["websocket", "polling"], // polling fallback is critical
      reconnection:          true,
      reconnectionDelay:     1000,
      reconnectionAttempts:  15,
      timeout:               20000,
    });

    _socket.on("connect", () =>
      console.log("✅ Socket connected:", _socket.id)
    );
    _socket.on("disconnect", (reason) =>
      console.log("🔌 Socket disconnected:", reason)
    );
    _socket.on("connect_error", (err) =>
      console.error("❌ Socket error:", err.message)
    );

    return _socket;
  }, []);

  const disconnect = useCallback(() => {
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }
  }, []);

  const joinSession = useCallback((sessionId) => {
    if (!_socket) return;
    console.log("[useSocket] Emitting join-session →", sessionId);
    _socket.emit("join-session", { sessionId }); // must be object
  }, []);

  const watchSession = useCallback((sessionId) => {
    _socket?.emit("watch-session", { sessionId });
  }, []);

  const setThreshold = useCallback((sessionId, maxAttendees) => {
    _socket?.emit("set-threshold", { sessionId, maxAttendees });
  }, []);

  const removeStudent = useCallback((sessionId, studentId, facultyId) => {
    _socket?.emit("remove-student", { sessionId, studentId, facultyId });
  }, []);

  const addStudent = useCallback((sessionId, studentId, facultyId) => {
    _socket?.emit("add-student", { sessionId, studentId, facultyId });
  }, []);

  // Unified listener registration — always clears stale listener first
  const on = useCallback((event, cb) => {
    if (!_socket) return;
    _socket.off(event);
    _socket.on(event, cb);
  }, []);

  const off = useCallback((event) => {
    _socket?.off(event);
  }, []);

  const offAll = useCallback((events = []) => {
    events.forEach((ev) => _socket?.off(ev));
  }, []);

  const onQRUpdate         = useCallback((cb) => on("qr-refresh",       cb), [on]);
  const onAttendanceMarked = useCallback((cb) => on("attendance-marked", cb), [on]);
  const onSessionJoined    = useCallback((cb) => on("session-joined",    cb), [on]);
  const onStudentRemoved   = useCallback((cb) => on("student-removed",   cb), [on]);
  const onThresholdUpdated = useCallback((cb) => on("threshold-updated", cb), [on]);
  const onSessionStats     = useCallback((cb) => on("session-stats",     cb), [on]);
  const onSessionError     = useCallback((cb) => on("session-error",     cb), [on]);

  return {
    connect,
    disconnect,
    joinSession,
    watchSession,
    setThreshold,
    removeStudent,
    addStudent,
    on,
    off,
    offAll,
    onQRUpdate,
    onAttendanceMarked,
    onSessionJoined,
    onStudentRemoved,
    onThresholdUpdated,
    onSessionStats,
    onSessionError,
  };
};