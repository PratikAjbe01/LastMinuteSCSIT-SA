// src/features/smart-attendance/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Bell, Shield, Menu,
  ChevronDown, Settings, LayoutDashboard,
  BadgeCheck, Clock, Mail, Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/authStore";
import { EditProfileModal } from './../../../components/EditProfileModal';

// ── Role Badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const styles = {
    faculty: "bg-blue-50 text-blue-700 border-blue-200",
    student: "bg-emerald-50 text-emerald-700 border-emerald-200",
    admin:   "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
        font-bold uppercase tracking-wider border
        ${styles[role] || "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      <BadgeCheck className="w-2.5 h-2.5" />
      {role}
    </span>
  );
};

// ── User Dropdown ─────────────────────────────────────────────────────────────
const UserDropdown = ({ user, role, onLogout, onClose, onOpenSettings }) => {
  const navigate = useNavigate();

  const dashboardPaths = {
    faculty: "/smart/faculty/dashboard",
    student: "/smart/student/dashboard",
    admin:   "/smart/admin/dashboard",
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "My Dashboard",
      sublabel: "Overview & stats",
      onClick: () => { navigate(dashboardPaths[role] || "/"); onClose(); },
    },
    {
      icon: Settings,
      label: "Account Settings",
      sublabel: "Edit profile & preferences",
      // ← opens the modal instead of navigating
      onClick: () => { onClose(); onOpenSettings(); },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200
        rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30
            flex items-center justify-center flex-shrink-0">
            {user?.profileUrl ? (
              <img
                src={user.profileUrl}
                alt="avatar"
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm truncate">{user?.name || "User"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="w-3 h-3 text-blue-200 flex-shrink-0" />
              <p className="text-blue-100 text-xs truncate">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-lg
            text-[10px] text-white font-semibold border border-white/20">
            <BadgeCheck className="w-3 h-3" />
            {role?.charAt(0)?.toUpperCase() + role?.slice(1) || "User"}
          </span>
          {user?.department && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-lg
              text-[10px] text-white font-semibold border border-white/20">
              <Hash className="w-3 h-3" />
              {user.department}
            </span>
          )}
          {user?.rollNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 rounded-lg
              text-[10px] text-white font-semibold border border-white/20">
              <Hash className="w-3 h-3" />
              {user.rollNumber}
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
              hover:bg-slate-50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50
              flex items-center justify-center flex-shrink-0 transition-colors">
              <item.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-slate-400">{item.sublabel}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mx-4 border-t border-slate-100" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Session started ·{" "}
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="p-2 pt-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
            hover:bg-red-50 transition-colors group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100
            flex items-center justify-center flex-shrink-0 transition-colors">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600">Sign Out</p>
            <p className="text-xs text-slate-400">End your current session</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

// ── Notification Bell ─────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white
          hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500 shadow-sm"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200
              rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm">Notifications</h3>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                1 new
              </span>
            </div>
            <div className="p-2">
              <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">System Ready</p>
                  <p className="text-xs text-slate-500 mt-0.5">All attendance services are online.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Just now</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar = ({ onMenuClick }) => {
  const { user, token, logout, role } = useAuthStore();
  const navigate = useNavigate();

  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false); // ← new
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try { await logout(token); } finally {
      logout();
      navigate("/login");
      toast.success("Signed out successfully");
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center
        justify-between px-4 lg:px-6 flex-shrink-0 z-30 shadow-sm">

        {/* ── Left ── */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-500
              hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop brand */}
          <Link to="/" className="hidden lg:flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center
              shadow-sm shadow-blue-200 group-hover:bg-blue-700 transition-colors">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-4 group-hover:text-blue-700 transition-colors">
                LastMinute
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                Your Academics Partner
              </p>
            </div>
          </Link>

          {/* Mobile brand */}
          <Link to="/" className="lg:hidden flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">LastMinute</span>
          </Link>

          <div className="hidden lg:block w-px h-5 bg-slate-200 ml-1" />
          <div className="hidden lg:block">
            <RoleBadge role={role} />
          </div>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className={`flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-xl border
                transition-all shadow-sm
                ${dropdownOpen
                  ? "border-blue-300 bg-blue-50 shadow-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.profileUrl ? (
                  <img src={user.profileUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-none">
                  {user?.name?.split(" ")[0] || "User"}
                </p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5 leading-none">{role}</p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200
                  ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <UserDropdown
                  user={user}
                  role={role}
                  onLogout={handleLogout}
                  onClose={() => setDropdownOpen(false)}
                  onOpenSettings={() => setSettingsOpen(true)} // ← pass down
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Edit Profile Modal (portal-level) ── */}
      <AnimatePresence>
        {settingsOpen && (
          <EditProfileModal
            onClose={() => setSettingsOpen(false)}
            setIsUserEdited={() => {}} // wire your real setter if available
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;