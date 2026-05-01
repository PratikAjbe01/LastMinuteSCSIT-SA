export const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const getAttendanceColor = (percentage) => {
  if (percentage >= 75) return "text-emerald-400";
  if (percentage >= 60) return "text-yellow-400";
  return "text-red-400";
};

export const getAttendanceBg = (percentage) => {
  if (percentage >= 75) return "bg-emerald-500/20 border-emerald-500/40";
  if (percentage >= 60) return "bg-yellow-500/20 border-yellow-500/40";
  return "bg-red-500/20 border-red-500/40";
};

export const getRoleRedirect = (role) => {
  const map = {
    student: "/student/dashboard",
    faculty: "/faculty/dashboard",
    admin: "/admin/dashboard",
  };
  return map[role] || "/login";
};