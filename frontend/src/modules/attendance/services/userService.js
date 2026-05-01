import { API_URL } from "../../../utils/urls";

// 🔹 Base Smart Attendance API
const API_BASE = `${API_URL}/api/smart-attendance`;
const buildHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const getAllStudents = async (token) => {
  const res = await fetch(`${API_BASE}/admin/students`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const createSubject = async (payload, token) => {
  const res = await fetch(`${API_BASE}/admin/subjects`, {
    method: "POST",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const createClass = async (classData, token) => {
  const res = await fetch(`${API_BASE}/admin/classes`, {
    method: "POST",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify(classData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create class");
  return data;
};


// ... existing code in userService.js ...

export const getAllSubjects = async (token) => {
  const res = await fetch(`${API_BASE}/admin/subjects`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getAllClasses = async (token) => {
  const res = await fetch(`${API_BASE}/admin/classes`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};



// Add this to your userService.js
export const getAllFaculty = async (token) => {
  const res = await fetch(`${API_BASE}/admin/faculty`, {
    headers: buildHeaders(token),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// This uses the existing updateClass endpoint to save assignments
export const updateClassAssignments = async (classId, assignments, token) => {
  const res = await fetch(`${API_BASE}/admin/classes/${classId}`, {
    method: "PUT",
    headers: buildHeaders(token),
    credentials: "include",
    body: JSON.stringify({ assignments }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};