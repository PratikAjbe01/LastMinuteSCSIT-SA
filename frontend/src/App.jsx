import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Toaster } from "react-hot-toast";

import FloatingShape from "./components/FloatingShape";
import LoadingSpinner from "./components/LoadingSpinner";
import Header from "./components/Header";
import Footer from "./components/Footer";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import SemestersPage from "./pages/Semesters";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import DocumentsPage from "./pages/DocumentsPage";
import MyFilesPage from "./pages/UserFilesPage";
import AllFilesPage from "./pages/AllFilesPage";
import AboutPage from "./pages/About";
import ShareFilePage from "./pages/ShareFilePage";
import AttendanceManager from "./pages/AttendanceManagerPage";
import CalculatorPage from "./pages/ToolsPage";

import { useAuthStore } from "./store/authStore";
import { ValuesContext } from "./context/ValuesContext";
import PlannerPage from "./pages/PlannerPage";
import AdminFilesPage from "./pages/AdminFilesPage";
import UsersPage from "./pages/AllUsersPage";
import VerifyUserEmail from "./pages/VerifyEmailPage";
import LeaderboardPage from "./pages/LeaderBoardPage";
import ManageTestimonials from "./pages/ManageTestimonials";
import ProfilePage from "./pages/UserProfilePage";

// 🔹 Smart Attendance (Proxy Module)
import StudentDashboard from "./modules/attendance/pages/student/StudentDashboard";
import QRScannerPage from "./modules/attendance/pages/student/QRScannerPage";
import AttendanceHistory from "./modules/attendance/pages/student/AttendanceHistory";
import FacultyDashboard from "./modules/attendance/pages/faculty/FacultyDashboard";
import StartAttendancePage from "./modules/attendance/pages/faculty/StartAttendancePage";
import SessionPage from "./modules/attendance/pages/faculty/SessionPage";
import FacultyReports from "./modules/attendance/pages/faculty/FacultyReports";
import AdminDashboard from "./modules/attendance/pages/admin/AdminDashboard";
import DashboardLayout from "./modules/attendance/layouts/DashboardLayout";
import ManageUsersPage from "./modules/attendance/pages/admin/ManageUsersPage";
import ManageTestimonialsPage from "./modules/attendance/pages/admin/ManageTestinomialsPage";
import ReportsPage from "./modules/attendance/pages/admin/ReportsPage";
import SubjectsPage from "./modules/attendance/pages/admin/SubjectsPage";
import DepartmentsPage from "./modules/attendance/pages/admin/DepartmentsPage";
import ClassesPage from "./modules/attendance/pages/admin/ClassesPage";
import { BookOpen, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import EditProfileModal from "./components/EditProfileModal";

// ── Route Guards ─────────────────────────────────────────────────────────────

const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
};

const RedirectAuthenticatedUser = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user) {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect") || `/${user.role === "admin" ? "admin/dashboard" : ""}`;
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Redirects /smart → correct role dashboard, stays inside DashboardLayout
const SmartModuleIndex = () => {
  const { user } = useAuthStore();
  const roleHome = {
    student: "/smart/student/dashboard",
    faculty: "/smart/faculty/dashboard",
    admin: "/smart/admin/dashboard",
  };
  return <Navigate to={roleHome[user?.role] || "/login"} replace />;
};

function App() {
  const { isCheckingAuth, checkAuth, user } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const navigate = useNavigate();

  console.log("Current User:", user);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && (!user.rollNumber || !user.department || !user.course || !user.semester)) {
      const timer = setTimeout(() => {
        setShowProfilePrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            setIsSidebarOpen((prev) => !prev);
            break;
          case "p":
            e.preventDefault();
            navigate("/scsit/courses");
            break;
          case "u":
            e.preventDefault();
            navigate("/upload");
            break;
          case "a":
            e.preventDefault();
            navigate("/allfiles");
            break;
          case "q":
            e.preventDefault();
            navigate("/calculations/tools/cgpa");
            break;
          case "h":
            e.preventDefault();
            navigate("/home");
            break;
          case "d":
            if (user?._id) {
              e.preventDefault();
              if (user?.course && user?.semester) {
                navigate(`/scsit/${user.course}/semesters/${user.semester}`);
              } else {
                navigate(`/scsit/mca/semesters/3`);
              }
            }
            break;
          case "l":
            if (user?._id) {
              e.preventDefault();
              navigate(`/admins/leaderboard`);
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, setIsSidebarOpen, user]);

  const floatingRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

  const isFloatingPage =
    floatingRoutes.some((route) => {
      if (route.includes(":")) {
        const base = route.split(":")[0];
        return location.pathname.startsWith(base);
      }
      return location.pathname === route;
    }) || location.pathname.startsWith("/reset-password");

  const isSmartRoute = location.pathname.startsWith("/smart");

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative overflow-hidden">
        {/* Subtle grid background matching your auth pages */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        {/* Ambient glowing blobs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-green-500/5 blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex flex-col items-center gap-8 z-10"
        >
          {/* Logo & Spinner Container */}
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Outer animated gradient ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-green-400 border-l-blue-500 opacity-80"
            />
            
            {/* Inner pulsing glow */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full bg-gradient-to-tr from-green-500/20 to-blue-500/20 blur-md"
            />
            
            {/* Center Logo Box */}
            <div className="w-16 h-16 rounded-2xl bg-gray-900/90 border border-gray-700/50 backdrop-blur-xl flex items-center justify-center shadow-2xl relative z-10">
              <BookOpen className="text-green-400 w-8 h-8" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text tracking-wide">
              Authenticating
            </h3>
            <div className="flex items-center gap-1.5 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-800/60 backdrop-blur-sm">
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Securing session</span>
              <div className="flex gap-0.5">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 rounded-full bg-green-500" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-green-500" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ValuesContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
        {!isSmartRoute && <Header />}
        <div
          className={`min-h-full flex items-center justify-center relative overflow-hidden ${
            isFloatingPage
              ? "bg-gradient-to-br from-gray-900 via-blue-900 to-black-900"
              : "bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900"
          }`}
        >
          {isFloatingPage && (
            <>
              <FloatingShape color="bg-blue-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
              <FloatingShape color="bg-black-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
              <FloatingShape color="bg-gray-500" size="w-32 h-32" top="40%" left="-10%" delay={2} />
            </>
          )}
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadDocumentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/scsit/courses" element={<Courses />} />
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route path="/scsit/:course/semesters" element={<SemestersPage />} />
          <Route
            path="/scsit/:course/semesters/:semesterId"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/files"
            element={
              <ProtectedRoute>
                <MyFilesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/share/file/:id" element={<ShareFilePage />} />
          <Route path="/allfiles" element={<AllFilesPage />} />
          <Route
            path="/attendance/manager/user/:userId"
            element={
              <ProtectedRoute>
                <AttendanceManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner/todos"
            element={
              <ProtectedRoute>
                <PlannerPage />
              </ProtectedRoute>
            }
          />
          <Route path="/calculations/tools/:toolName" element={<CalculatorPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/admin/allfiles"
            element={
              <ProtectedRoute>
                <AdminFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allusers"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-user-email"
            element={
              <ProtectedRoute>
                <VerifyUserEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins/testimonials"
            element={
              <ProtectedRoute>
                <ManageTestimonials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />

          {/* ================= SMART ATTENDANCE MODULE ================= */}
          <Route
            path="/smart"
            element={<DashboardLayout />}
          >
            {/* Student Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["student", "admin"]} />}>
              <Route path="student/dashboard" element={<StudentDashboard />} />
              <Route path="student/scan" element={<QRScannerPage />} />
              <Route path="student/history" element={<AttendanceHistory />} />
            </Route>

            {/* Faculty Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["faculty", "admin"]} />}>
              <Route path="faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="faculty/start-attendance" element={<StartAttendancePage />} />
              <Route path="faculty/session" element={<SessionPage />} />
              <Route path="faculty/reports" element={<FacultyReports />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<ManageUsersPage />} />
              <Route path="admin/testimonials" element={<ManageTestimonialsPage />} />
              <Route path="admin/reports" element={<ReportsPage />} />
              <Route path="admin/subjects" element={<SubjectsPage />} />
              <Route path="admin/departments" element={<DepartmentsPage />} />
              <Route path="admin/classes" element={<ClassesPage />} />
            </Route>

            <Route index element={<SmartModuleIndex />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isSmartRoute && <Footer />}

        <AnimatePresence>
          {showProfilePrompt && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Incomplete Profile</h3>
                <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                  To use Smart Attendance features, you must update your profile with your Roll Number, Department, Course, and Semester.
                </p>
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => {
                      setShowProfilePrompt(false);
                      setEditModalOpen(true);
                    }} 
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                  >
                    Update Profile
                  </button>
                  <button 
                    onClick={() => setShowProfilePrompt(false)} 
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                  >
                    Update Later
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {editModalOpen && (
          <EditProfileModal
            isOpen={editModalOpen}
            setIsOpen={setEditModalOpen}
            onClose={() => setEditModalOpen(false)}
          />
        )}

        <Toaster />
      </ValuesContext.Provider>
    </>
  );
}

export default App;
