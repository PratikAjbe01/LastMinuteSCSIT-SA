import { useAuthStore } from "../../../store/authStore";
import { API_URL } from "../../../utils/urls";
import { getAllStudents } from "./userService";

// 🔹 Base Smart Attendance API
const API_BASE = `${API_URL}/api/smart-attendance`;

// 🔹 Automatically attach token
const buildHeaders = () => {
  const token = localStorage.getItem("token");
  // const {token} = useAuthStore();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── Setup (Still outside smart-attendance) ─────────────

export const checkSetup = async () => {
  const res = await fetch(`${API_BASE}/auth/check-setup`, {
    headers: buildHeaders(),
  });
  return handleResponse(res);
};

export const setupAdmin = async (formData) => {
  const res = await fetch(`${API_BASE}/auth/setup`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(formData),
  });
  return handleResponse(res);
};

// ─── Admin ─────────────────────────────────────────────

export const adminAPI = {
  getDashboard: () =>
    fetch(`${API_BASE}/admin/dashboard`, { headers: buildHeaders() }).then(handleResponse),

  getStudents: () =>
    fetch(`${API_BASE}/admin/students`, { headers: buildHeaders() }).then(handleResponse),

  createStudent: (body) =>
    fetch(`${API_BASE}/admin/students`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  updateStudent: (id, body) =>
    fetch(`${API_BASE}/admin/students/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  deleteStudent: (id) =>
    fetch(`${API_BASE}/admin/students/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then(handleResponse),

  getFaculty: () =>
    fetch(`${API_BASE}/admin/faculty`, { headers: buildHeaders() }).then(handleResponse),

  createFaculty: (body) =>
    fetch(`${API_BASE}/admin/faculty`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  updateFaculty: (id, body) =>
    fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  deleteFaculty: (id) =>
    fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then(handleResponse),

  getSubjects: () =>
    fetch(`${API_BASE}/admin/subjects`, { headers: buildHeaders() }).then(handleResponse),

  createSubject: (body) =>
    fetch(`${API_BASE}/admin/subjects`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  updateSubject: (id, body) =>
    fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  deleteSubject: (id) =>
    fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then(handleResponse),

  getClasses: () =>
    fetch(`${API_BASE}/admin/classes`, { headers: buildHeaders() }).then(handleResponse),

  createClass: (body) =>
    fetch(`${API_BASE}/admin/classes`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  updateClass: (id, body) =>
    fetch(`${API_BASE}/admin/classes/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  deleteClass: (id) =>
    fetch(`${API_BASE}/admin/classes/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then(handleResponse),

  getReports: () =>
    fetch(`${API_BASE}/admin/reports`, { headers: buildHeaders() }).then(handleResponse),

  enrollStudent: (classId, studentId) =>
    fetch(`${API_BASE}/admin/classes/${classId}/enroll`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ studentId }),
    }).then(handleResponse),
};

// ─── Faculty ───────────────────────────────────────────

export const facultyAPI = {
  getMyClasses: () =>
    fetch(`${API_BASE}/faculty/my-classes`, { headers: buildHeaders() }).then(handleResponse),

  getClassById: (id) =>
    fetch(`${API_BASE}/faculty/my-classes/${id}`, { headers: buildHeaders() }).then(handleResponse),

  createClass: (body) =>
    fetch(`${API_BASE}/faculty/my-classes`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  updateClass: (id, body) =>
    fetch(`${API_BASE}/faculty/my-classes/${id}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  deleteClass: (id) =>
    fetch(`${API_BASE}/faculty/my-classes/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then(handleResponse),

  startSession: (body) =>
    fetch(`${API_BASE}/faculty/start-session`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  endSession: (body) =>
    fetch(`${API_BASE}/faculty/end-session`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  getSessions: () =>
    fetch(`${API_BASE}/faculty/sessions`, { headers: buildHeaders() }).then(handleResponse),

  getReports: () =>
    fetch(`${API_BASE}/faculty/reports`, { headers: buildHeaders() }).then(handleResponse),

  getAllStudents: () =>
    fetch(`${API_BASE}/faculty/students`, { headers: buildHeaders() }).then(handleResponse),
};

// ─── Student ───────────────────────────────────────────

export const studentAPI = {
  getDashboard: () =>
    fetch(`${API_BASE}/student/dashboard`, { headers: buildHeaders() }).then(handleResponse),

  getAttendanceHistory: () =>
    fetch(`${API_BASE}/student/attendance-history`, { headers: buildHeaders() }).then(handleResponse),

  markAttendance: (body) =>
    fetch(`${API_BASE}/attendance/mark`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),
};