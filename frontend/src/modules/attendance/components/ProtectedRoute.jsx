import { Navigate, Outlet } from "react-router-dom";
import Loader from "./Loader";
import { useAuthStore } from "../../../store/authStore";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <Loader fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = role === "student" ? "/student/dashboard"
      : role === "faculty" ? "/faculty/dashboard"
      : "/admin/dashboard";
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;