"use client"

import { useState, useMemo, useContext, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, User, LogOut, Menu, X, Home, Upload, GraduationCap,
  File, Files, PanelTopClose, BookMarked, Edit, FileChartPie,
  Users, Trophy, Edit2, User2, ChevronDown, LayoutDashboard,
  CalendarCheck, Shield, Hash, Building2, Sparkles,
} from "lucide-react"
import { useMatch, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { ValuesContext } from "../context/ValuesContext"
import { useSwipeable } from "react-swipeable"
import { EditProfileModal } from "./EditProfileModal"
import toast from "react-hot-toast"
import { API_URL } from "../utils/urls"

// ── Helpers ───────────────────────────────────────────────────────────────────
const isActivePath = (href, pathname) => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

// ── Desktop Nav Link ──────────────────────────────────────────────────────────
const NavLink = ({ href, label, onClick, pathname }) => {
  const active = isActivePath(href, pathname);
  return (
    <button
      onClick={() => onClick(href)}
      className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${active
          ? "text-green-400 bg-green-500/10"
          : "text-gray-300 hover:text-green-400 hover:bg-white/5"
        }`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="desktop-nav-indicator"
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400"
        />
      )}
    </button>
  );
};

// ── Desktop Dropdown ──────────────────────────────────────────────────────────
const NavDropdown = ({ label, icon: Icon, items, pathname, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const anyActive = items.some((i) => isActivePath(i.href, pathname));

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
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
          ${anyActive || open
            ? "text-green-400 bg-green-500/10"
            : "text-gray-300 hover:text-green-400 hover:bg-white/5"
          }`}
      >
        {Icon && <Icon size={14} />}
        {label}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 opacity-60 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-52 rounded-xl overflow-hidden z-50
              bg-gray-900/95 backdrop-blur-xl border border-gray-700/60
              shadow-2xl shadow-black/60"
          >
            <div className="p-1">
              {items.map((item) => {
                const active = isActivePath(item.href, pathname);
                return (
                  <button
                    key={item.href}
                    onClick={() => { onNavigate(item.href); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left
                      ${active
                        ? "bg-green-500/15 text-green-400 font-semibold"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <item.icon size={14} className={active ? "text-green-400" : "text-gray-500"} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Role CTA ─────────────────────────────────────────────────────────────────
const RoleCTA = ({ user, onNavigate }) => {
  if (!user) return null;
  const role = user.role || "student";

  const config = {
    student: {
      label: "Attendance",
      icon:  CalendarCheck,
      href:  `/smart/student/dashboard`,
    },
    faculty: {
      label: "Faculty Dashboard",
      icon:  LayoutDashboard,
      href:  "/smart/faculty/dashboard",
    },
    admin: {
      label: "Admin Dashboard",
      icon:  Shield,
      href:  "/smart/admin/dashboard",
    },
  };

  const cfg  = config[role] || config.student;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => onNavigate(cfg.href)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        bg-gradient-to-r from-green-500 to-emerald-500
        text-white shadow-lg shadow-green-500/20
        hover:shadow-green-500/40 hover:from-green-400 hover:to-emerald-400
        transition-all duration-300 active:scale-95"
    >
      <Icon size={14} />
      {cfg.label}
    </button>
  );
};

// ── User Menu ─────────────────────────────────────────────────────────────────
const UserMenu = ({ user, fetchedUser, onLogout, onEdit, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user?.name || "U")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const roleColors = {
    admin:   "from-violet-500 to-purple-600",
    faculty: "from-blue-500 to-cyan-500",
    student: "from-green-500 to-emerald-500",
  };
  const avatarGradient = roleColors[user?.role] || roleColors.student;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all duration-200 bg-black/40
          ${open
            ? "border-green-500/50 bg-green-500/10"
            : "border-gray-700/60 bg-white/5 hover:border-green-500/30 hover:bg-white/8"
          }`}
      >
        <div className={`w-7 h-7 rounded-lg overflow-hidden flex-shrink-0
          bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}>
          {fetchedUser?.profileUrl ? (
            <img src={fetchedUser.profileUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-bold">{initials}</span>
          )}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-white leading-none">
            {user?.name?.split(" ")[0] || "User"}
          </p>
          <p className="text-[10px] text-gray-500 capitalize mt-0.5">{user?.role || "student"}</p>
        </div>
        <ChevronDown
          size={13}
          className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50
              bg-black/40 backdrop-blur-xl border border-gray-700/60
              shadow-2xl shadow-black/70"
          >
            {/* Profile header */}
            <div className="relative px-5 py-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent" />
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green-500/5" />

              <div className="relative flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0
                  bg-gradient-to-br ${avatarGradient} flex items-center justify-center
                  border-2 border-white/10 shadow-lg`}>
                  {fetchedUser?.profileUrl ? (
                    <img src={fetchedUser.profileUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-sm truncate">{user?.name || "User"}</p>
                  <p className="text-gray-400 text-xs truncate mt-0.5">{user?.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      bg-green-500/15 border border-green-500/20 text-green-400 text-[10px] font-semibold capitalize">
                      {user?.role || "student"}
                    </span>
                    {fetchedUser?.department && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                        bg-white/5 border border-white/10 text-gray-400 text-[10px] font-semibold">
                        <Building2 size={8} />{fetchedUser.department}
                      </span>
                    )}
                    {fetchedUser?.rollNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                        bg-white/5 border border-white/10 text-gray-400 text-[10px] font-semibold">
                        <Hash size={8} />{fetchedUser.rollNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-4 h-px bg-gray-800" />

            {/* Menu items */}
            <div className="p-2">
              {[
                {
                  icon: User2,
                  label: "View Profile",
                  sub: "Your public profile",
                  href: "/user/profile",
                },
                {
                  icon: LayoutDashboard,
                  label: "Dashboard",
                  sub: "Overview & stats",
                  href: user?.role === "faculty"
                    ? "/smart/faculty/dashboard"
                    : user?.role === "admin"
                      ? "/smart/admin/dashboard"
                      : `/attendance/manager/user/${user?._id}`,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { onNavigate(item.href); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-gray-300 hover:text-white hover:bg-white/5
                    transition-all duration-150 group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-green-500/10
                    flex items-center justify-center flex-shrink-0 transition-colors">
                    <item.icon size={14} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
                  </div>
                </button>
              ))}

              <button
                onClick={() => { onEdit(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-gray-300 hover:text-white hover:bg-white/5
                  transition-all duration-150 group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-green-500/10
                  flex items-center justify-center flex-shrink-0 transition-colors">
                  <Edit size={14} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Edit Profile</p>
                  <p className="text-xs text-gray-600 mt-0.5">Update your information</p>
                </div>
              </button>
            </div>

            <div className="mx-4 h-px bg-gray-800" />

            <div className="p-2">
              <button
                onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-gray-400 hover:text-red-400 hover:bg-red-500/8
                  transition-all duration-150 group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-red-500/10
                  flex items-center justify-center flex-shrink-0 transition-colors">
                  <LogOut size={14} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Sign Out</p>
                  <p className="text-xs text-gray-600 mt-0.5">End your current session</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Header ───────────────────────────────────────────────────────────────
const Header = () => {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen } = useContext(ValuesContext);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fetchedUser,   setFetchedUser]   = useState(null);
  const [scrolled,      setScrolled]      = useState(false);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Body lock
  useEffect(() => {
    document.body.style.overflow = (isSidebarOpen || editModalOpen) ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isSidebarOpen, editModalOpen]);

  // Fetch user
  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/api/auth/fetchuser/${user._id}`);
        const data = await res.json();
        if (data.success) setFetchedUser(data.user);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user?._id]);

  const isSemestersPage = useMatch("/scsit/:course/semesters");

  const handleNav = (href) => {
    const publicRoutes = ["/", "/about", "/scsit/courses", "/allfiles", "/calculations/tools/cgpa"]; 
    const isPublicPath = publicRoutes.includes(href) || href.startsWith("/scsit/");
    if (!user && !isPublicPath) {
      toast.error("User Must Be Logged In.", {
        style: { 
          border: "1px solid #713200", 
          padding: "16px", 
          color: "#713200",
          background: "#fff"
        },
        iconTheme: { primary: "#4ade80", secondary: "#ffffff" },
      });
    }
    navigate(href);
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsSidebarOpen(false);
    localStorage.removeItem("user");
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  // ── Nav groups ────────────────────────────────────────────────────────────
  const exploreItems = [
    { href: "/scsit/courses",           label: "Courses",  icon: GraduationCap },
    { href: "/allfiles",                label: "All Files", icon: Files },
    {href: `/attendance/manager/user/${user?._id}`, label: "Attendance Manager (Student Only)", icon: CalendarCheck },
    { href: "/planner/todos", label: "Task Planner", icon: BookMarked },
    { href: "/calculations/tools/cgpa", label: "Tools",    icon: PanelTopClose },
    {href: "/about", label: "About Us", icon: Sparkles},
  ];

  const adminItems = useMemo(() => {
    if (user?.isAdmin !== "admin") return [];
    return [
      { href: "/upload",             label: "Upload",        icon: Upload },
      { href: "/profile/files",      label: "My Files",      icon: File },
      { href: "/admin/allfiles",     label: "Admin Uploads", icon: FileChartPie },
      { href: "/allusers",           label: "All Users",     icon: Users },
      { href: "/admins/leaderboard", label: "Leaderboard",   icon: Trophy },
    ];
  }, [user]);

  const testimonialAllowed = ["bdhakad886@gmail.com", "pratikajbe40@gmail.com"];

  const allSidebarItems = useMemo(() => {
    const base = [
      { href: "/",                          label: "Home",    icon: Home },
      { href: "/scsit/courses",             label: "Courses", icon: GraduationCap },
      { href: "/allfiles",                  label: "Files",   icon: Files },
      { href: "/calculations/tools/cgpa",   label: "Tools",   icon: PanelTopClose },
    ];
    if (user?.role === "student") {
      base.push({ href: `/attendance/manager/user/${user._id}`, label: "Attendance", icon: CalendarCheck });
    }
    base.push({ href: "/planner/todos", label: "Task Planner", icon: BookMarked });
    if (user) base.push({ href: "/user/profile", label: "Profile", icon: User2 });
    if (user?.isAdmin === "admin") base.push(...adminItems);
    if (testimonialAllowed.includes(user?.email)) {
      base.push({ href: "/admins/testimonials", label: "Testimonials", icon: Edit2 });
    }
    return base;
  }, [user, adminItems]);

  // Swipe to close
  const swipeHandlers = useSwipeable({
    onSwipedRight:                () => setIsSidebarOpen(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse:                   true,
    delta:                        50,
  });

  const initials = (user?.name || "U")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const roleColors = {
    admin:   "from-violet-500 to-purple-600",
    faculty: "from-blue-500 to-cyan-500",
    student: "from-green-500 to-emerald-500",
  };
  const avatarGradient = roleColors[user?.role] || roleColors.student;

  return (
    <>
      {/* ── Header Bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${scrolled
            ? "bg-gray-950/30 backdrop-blur-xl border-b border-gray-800/80 shadow-lg shadow-black/30"
            : "bg-transparent border-b border-transparent border-b-gray-800/20"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <div className="w-8 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg
                flex items-center justify-center shadow-lg shadow-green-500/25
                group-hover:shadow-green-500/40 transition-all duration-300">
                <BookOpen size={17} className="text-white" />
              </div>
              <div className="hidden sm:block pt-0">
                <p className="text-[20px] font-bold text-white leading-none
                  group-hover:text-green-400 transition-colors duration-200">
                  LastMinute
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-none">
                  SCSIT · Indore
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              <NavLink
                href="/"
                label="Home"
                onClick={handleNav}
                pathname={location.pathname}
              />
              <NavDropdown
                label="Explore"
                items={exploreItems}
                pathname={location.pathname}
                onNavigate={handleNav}
              />
              {adminItems.length > 0 && (
                <NavDropdown
                  label="Admin"
                  icon={Shield}
                  items={adminItems}
                  pathname={location.pathname}
                  onNavigate={handleNav}
                />
              )}
              {testimonialAllowed.includes(user?.email) && (
                <NavLink
                  href="/admins/testimonials"
                  label="Testimonials"
                  onClick={handleNav}
                  pathname={location.pathname}
                />
              )}
            </nav>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3">
              {user && <RoleCTA user={user} onNavigate={handleNav} />}

              {user ? (
                <UserMenu
                  user={user}
                  fetchedUser={fetchedUser}
                  onLogout={handleLogout}
                  onEdit={() => setEditModalOpen(true)}
                  onNavigate={handleNav}
                />
              ) : (
                <button
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
                    bg-gradient-to-r from-green-500 to-emerald-500 text-white
                    shadow-lg shadow-green-500/20 hover:shadow-green-500/40
                    hover:from-green-400 hover:to-emerald-400
                    transition-all duration-300 active:scale-95"
                >
                  <User size={14} /> Sign In
                </button>
              )}
            </div>

            {/* Role CTA pill */}
            {user && (
              <div className="px-2 pt-2 pb-1 flex-shrink-0">
                <button
                  onClick={() => {
                    const role = user.role || "student";
                    const href = role === "faculty"
                      ? "/smart/faculty/dashboard"
                      : role === "admin"
                        ? "/smart/admin/dashboard"
                        : `/smart/student/dashboard`;
                    handleNav(href);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold
                    shadow-lg shadow-green-500/20 transition-all active:scale-95"
                >
                  {user.role === "faculty"
                    ? <><LayoutDashboard size={14} /> Faculty Dashboard</>
                    : user.role === "admin"
                      ? <><Shield size={14} /> Admin Dashboard</>
                      : <><CalendarCheck size={14} />Attendance</>
                  }
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-2 rounded-xl border border-gray-700/60 bg-white/5
                text-gray-400 hover:text-green-400 hover:border-green-500/40
                hover:bg-green-500/5 transition-all duration-200"
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Backdrop ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            {...swipeHandlers}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-80 z-50 flex flex-col md:hidden
              bg-gray-950 border-l border-gray-800/80"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-5 py-4
              border-b border-gray-800/80 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg
                  flex items-center justify-center shadow-md shadow-green-500/20">
                  <BookOpen size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white">Navigation</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl border border-gray-800 text-gray-500
                  hover:text-white hover:border-gray-700 transition-all"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Role CTA pill */}
            {user && (
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const role = user.role || "student";
                    const href = role === "faculty"
                      ? "/smart/faculty/dashboard"
                      : role === "admin"
                        ? "/smart/admin/dashboard"
                        : `/smart/student/dashboard`;
                    handleNav(href);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold
                    shadow-lg shadow-green-500/20 transition-all active:scale-95"
                >
                  {user.role === "faculty"
                    ? <><LayoutDashboard size={14} /> Faculty Dashboard</>
                    : user.role === "admin"
                      ? <><Shield size={14} /> Admin Dashboard</>
                      : <><CalendarCheck size={14} />Attendance</>
                  }
                </button>
              </div>
            )}

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest
                text-gray-600 px-3 mb-2">Menu</p>
              <nav className="space-y-0.5">
                {allSidebarItems.map((item, index) => {
                  const active = isActivePath(item.href, location.pathname);
                  return (
                    <motion.button
                      key={item.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.035, type: "spring", stiffness: 130 }}
                      onClick={() => handleNav(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                        transition-all duration-200 text-left
                        ${active
                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                          : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                        ${active ? "bg-green-500/20" : "bg-white/5"}`}>
                        <item.icon size={14}
                          className={active ? "text-green-400" : "text-gray-600"} />
                      </div>
                      <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                        {item.label}
                      </span>
                      {active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar footer */}
            <div className="flex-shrink-0 border-t border-gray-800/80 p-4 space-y-3">
              {user ? (
                <>
                  {/* User card */}
                  <button
                    onClick={() => { setIsSidebarOpen(false); navigate("/user/profile"); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl
                      bg-white/3 border border-gray-800 hover:border-green-500/30
                      hover:bg-green-500/5 transition-all group text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0
                      bg-gradient-to-br ${avatarGradient} flex items-center justify-center`}>
                      {fetchedUser?.profileUrl ? (
                        <img src={fetchedUser.profileUrl} alt="avatar"
                          className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate
                        group-hover:text-green-400 transition-colors">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setEditModalOpen(true); setIsSidebarOpen(false); }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                        bg-white/5 border border-gray-800 hover:border-green-500/30
                        hover:bg-green-500/8 text-gray-300 hover:text-green-400
                        text-sm font-semibold transition-all"
                    >
                      <Edit size={13} /> Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                        bg-white/5 border border-gray-800 hover:border-red-500/30
                        hover:bg-red-500/8 text-gray-300 hover:text-red-400
                        text-sm font-semibold transition-all"
                    >
                      <LogOut size={13} /> Sign Out
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    bg-gradient-to-r from-green-500 to-emerald-500 text-white
                    font-semibold text-sm shadow-lg shadow-green-500/20 transition-all"
                >
                  <User size={15} /> Sign In to Continue
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {editModalOpen && (
        <EditProfileModal
          isOpen={editModalOpen}
          setIsOpen={setEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default Header;