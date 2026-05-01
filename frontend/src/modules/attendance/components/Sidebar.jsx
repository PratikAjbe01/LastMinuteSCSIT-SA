// src/features/smart-attendance/components/Sidebar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, QrCode, History, Users,
  BarChart3, Settings, X, ClipboardList,
  Layers, Wifi, ChevronRight,
  BookOpen,
  Building2,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import { useIdentityAuth } from "../hooks/useFingerPrint";

// ── Nav Config ────────────────────────────────────────────────────────────────
const studentNav = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",          icon: LayoutDashboard, to: "/smart/student/dashboard" },
      { label: "Scan QR Code",       icon: QrCode,          to: "/smart/student/scan", requiresAuth: true },
      { label: "Attendance History", icon: History,         to: "/smart/student/history" },
    ],
  },
];

const facultyNav = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",        icon: LayoutDashboard, to: "/smart/faculty/dashboard" },
      { label: "Start Attendance", icon: QrCode,          to: "/smart/faculty/start-attendance" },
      { label: "Live Session",     icon: Wifi,            to: "/smart/faculty/session" },
      { label: "Reports",          icon: BarChart3,       to: "/smart/faculty/reports" },
    ],
  },
];

const adminNav = [
  {
    group: "Management",
    items: [
      { label: "Dashboard",   icon: LayoutDashboard, to: "/smart/admin/dashboard" },
      { label: "Users",       icon: Users,           to: "/smart/admin/users" },
      { label: "Testimonials", icon: ClipboardList,   to: "/smart/admin/testimonials" },
      { label: "Reports",     icon: ClipboardList,   to: "/smart/admin/reports" },
      { label: "Classes",     icon: Layers,          to: "/smart/admin/classes" },
      { label: "Subjects",    icon: BookOpen,        to: "/smart/admin/subjects" },
      { label: "Departments", icon: Building2,       to: "/smart/admin/departments" },
    ],
  },
];

const navByRole = { student: studentNav, faculty: facultyNav, admin: adminNav };

const roleConfig = {
  faculty: { bg: "bg-blue-600",    light: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  student: { bg: "bg-emerald-600", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  admin:   { bg: "bg-violet-600",  light: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  dot: "bg-violet-500"  },
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const Tooltip = ({ label, children, active }) => {
  const [show, setShow] = useState(false);

  if (!active) return <>{children}</>;

  return (
    <div
      className="relative flex items-center w-full"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.13 }}
            // portal-like: fixed so it escapes all overflow/clip contexts
            className="fixed z-[9999] pointer-events-none"
            // positioned via inline style set by the parent wrapper
            style={{ left: "var(--tt-x)", top: "var(--tt-y)", transform: "translateY(-50%)" }}
          >
            <div className="relative ml-3 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Tooltip Host — measures position and sets CSS vars ────────────────────────
const TooltipHost = ({ label, active, children }) => {
  const ref = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);
  const hostRef = { current: null };

  if (!active) return <>{children}</>;

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.right, y: rect.top + rect.height / 2 });
    setShow(true);
  };

  return (
    <div
      ref={(el) => (hostRef.current = el)}
      className="relative flex items-center w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.13 }}
            className="pointer-events-none"
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y - 12,
              transform: "translateY(-50%)",
              zIndex: 99999,
            }}
          >
            <div className="relative ml-3 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Nav Item ──────────────────────────────────────────────────────────────────
const NavItem = ({ item, onClose, role, collapsed, onHoverExpand }) => {
  const rc = roleConfig[role] || roleConfig.faculty;
  const navigate = useNavigate();
  const { verifyIdentity } = useIdentityAuth();

  const handleClick = async (e) => {
    if (item.requiresAuth) {
      e.preventDefault(); // Stop normal navigation
      const isVerified = await verifyIdentity("Confirm it's you before marking attendance.");
      
      if (isVerified) {
        navigate(item.to); // Only navigate if fingerprint passes
        if (onClose) onClose();
      }
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <TooltipHost label={item.label} active={collapsed}>
      <NavLink
        to={item.to}
        onClick={handleClick} // 🔴 Use our intercepted click
        end
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-xl transition-all duration-150 w-full
          ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
          ${isActive
            ? `${rc.light} ${rc.text} font-semibold`
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex items-center justify-center flex-shrink-0 rounded-lg transition-all duration-200
                ${collapsed ? "w-9 h-9" : "w-8 h-8"}
                ${isActive ? `${rc.bg} shadow-sm` : "bg-slate-100 group-hover:bg-slate-200"}`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
            </span>

            {!collapsed && (
              <>
                <span className="flex-1 text-sm truncate">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId={`nav-dot-${role}`}
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.bg}`}
                  />
                )}
              </>
            )}

            {collapsed && isActive && (
              <span className={`absolute right-1 top-1 w-1.5 h-1.5 rounded-full ${rc.bg}`} />
            )}
          </>
        )}
      </NavLink>
    </TooltipHost>
  );
};

// ── Sidebar Content ───────────────────────────────────────────────────────────
const SidebarContent = ({ onClose, collapsed, onCollapsedChange, isMobile, onHoverExpand }) => {
  const { role, user } = useAuthStore();
  const navGroups = navByRole[role] || [];
  const rc = roleConfig[role] || roleConfig.faculty;

  return (
    <div className="h-full flex flex-col overflow-hidden relative">

      {/* ── User Profile ── */}
      <div className={`flex-shrink-0 pt-5 pb-4 border-b border-slate-100 ${collapsed && !isMobile ? "px-2" : "px-4"}`}>
        {collapsed && !isMobile ? (
          <TooltipHost label={`${user?.name || "User"} · ${role}`} active>
            <div className="flex justify-center w-full">
              <div className="relative">
                <div className={`w-9 h-9 rounded-xl ${rc.bg} flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
            </div>
          </TooltipHost>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-xl ${rc.bg} flex items-center justify-center shadow-sm`}>
                <span className="text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {user?.email || user?.rollNumber || "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className={`flex-1 py-4 space-y-5 overflow-y-auto overflow-x-visible ${collapsed && !isMobile ? "px-2" : "px-3"}`}
        onMouseLeave={() => !isMobile && onHoverExpand && onHoverExpand(false)}
      >
        {navGroups.map((group) => (
          <div key={group.group}>
            {!collapsed || isMobile ? (
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {group.group}
              </p>
            ) : (
              <div className="mb-2 h-px bg-slate-100" />
            )}
            <div className={`space-y-0.5 ${collapsed && !isMobile ? "flex flex-col items-center" : ""}`}>
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  onClose={onClose}
                  role={role}
                  collapsed={collapsed && !isMobile}
                  onHoverExpand={onHoverExpand}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className={`flex-shrink-0 p-3 border-t border-slate-100`}>
        {collapsed && !isMobile ? (
          <TooltipHost label="System Online · v3.0.2" active>
            <div className="flex justify-center w-full">
              <span className={`w-2.5 h-2.5 rounded-full ${rc.dot} animate-pulse`} />
            </div>
          </TooltipHost>
        ) : (
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${rc.light} border ${rc.border}`}>
            <span className={`w-2 h-2 rounded-full ${rc.dot} animate-pulse flex-shrink-0`} />
            <div className="min-w-0">
              <p className={`text-[10px] font-bold ${rc.text} uppercase tracking-wider leading-none`}>
                System Online
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">v3.0.2 · All services active</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop collapse toggle — floats on right border ── */}
      {!isMobile && (
        <motion.button
          onClick={() => onCollapsedChange((p) => !p)}
          title={collapsed ? "Expand" : "Collapse"}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.92 }}
          style={{ zIndex: 99999 }}
          className="absolute -right-0 top-16 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:shadow-blue-100 transition-colors"
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </motion.button>
      )}
    </div>
  );
};

// ── Widths ────────────────────────────────────────────────────────────────────
const EXPANDED_W = 256;
const COLLAPSED_W = 68;

// ── Main Export ───────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose, collapsed, onCollapsedChange }) => {
  // Hover-expand: temporarily expand when user hovers nav items while collapsed
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const effectiveCollapsed = collapsed && !hoverExpanded;
  const effectiveWidth = effectiveCollapsed ? COLLAPSED_W : EXPANDED_W;

  const handleHoverExpand = (val) => {
    if (collapsed) setHoverExpanded(val);
  };

  return (
    <>
      {/* ══ Desktop ══ */}
      <motion.aside
        animate={{ width: effectiveWidth }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        // z-index high enough so the toggle button and tooltips always show above content
        className="hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0"
        style={{ zIndex: 9998, overflow: "visible" }}
      >
        {/* Inner clip so content doesn't bleed, but the button can still escape */}
        <div className="h-full overflow-hidden relative flex flex-col">
          <SidebarContent
            collapsed={effectiveCollapsed}
            onCollapsedChange={onCollapsedChange}
            isMobile={false}
            onHoverExpand={handleHoverExpand}
          />
        </div>
      </motion.aside>

      {/* ══ Mobile Drawer ══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="lg:hidden fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 shadow-2xl overflow-hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent
                onClose={onClose}
                collapsed={false}
                onCollapsedChange={() => {}}
                isMobile={true}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;