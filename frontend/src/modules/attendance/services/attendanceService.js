import { API_URL } from "../../../utils/urls";

// 🔹 Base Smart Attendance API
const API_BASE = `${API_URL}/api/smart-attendance`;
const buildHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ─── Faculty ─────────────────────────────────────────────────────────────────

export const getFacultyClasses = async (token) => {
  const res = await fetch(`${API_BASE}/faculty/my-classes`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const startAttendanceSession = async (classId, subjectId, token) => {
  const res = await fetch(`${API_BASE}/faculty/start-session`, {
    method: "POST",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify({ classId, subjectId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const endAttendanceSession = async (sessionId, token) => {
  const res = await fetch(`${API_BASE}/faculty/end-session`, {
    method: "POST",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getFacultyReports = async (token) => {
  const res = await fetch(`${API_BASE}/faculty/reports`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// ─── Student ──────────────────────────────────────────────────────────────────

export const markAttendance = async (sessionId, qrToken, token) => {
  const res = await fetch(`${API_BASE}/attendance/mark`, {
    method: "POST",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify({ sessionId, qrToken }),
  });
  const data = await res.json();
  // Don't throw — we want to handle the response messages in the UI
  return { ok: res.ok, status: res.status, data };
};

export const getStudentAttendanceHistory = async (token) => {
  const res = await fetch(`${API_BASE}/student/attendance-history`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getStudentDashboardData = async (token) => {
  const res = await fetch(`${API_BASE}/student/dashboard`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};