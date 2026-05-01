// src/features/smart-attendance/pages/admin/ManageUsersPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  UserCheck,
  UserX,
  Filter,
  MoreVertical,
  Users,
  ShieldAlert,
  TrendingUp,
  Calendar,
  Edit2,
  Save,
  Lock,
  Phone,
  Hash,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { useAuthStore } from "../../../../store/authStore";
import toast from "react-hot-toast";
import { API_URL } from "../../../../utils/urls";
import { createPortal } from "react-dom";

// ── Constants ────────────────────────────────────────────────────────────────
const LIMITS = [10, 20, 50];
const SUPER_ADMINS = ["pratikajbe40@gmail.com", "bdhakad886@gmail.com"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Users", param: {} },
  { value: "admin", label: "Admins Only", param: { isAdmin: "admin" } },
  { value: "user", label: "Regular Users", param: { isAdmin: "user" } },
  { value: "verified", label: "Verified", param: { isVerified: "true" } },
  { value: "unverified", label: "Unverified", param: { isVerified: "false" } },
  { value: "student", label: "Students", param: { role: "student" } },
  { value: "faculty", label: "Faculty", param: { role: "faculty" } },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const buildAuthHeaders = (userId) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${userId}`,
});

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const avatarColors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
const getAvatarColor = (id = "") => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

// ── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600", border: "border-blue-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-600", border: "border-amber-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-600", border: "border-emerald-100" },
    red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-600", border: "border-red-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "text-indigo-600", border: "border-indigo-100" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-4 shadow-sm flex items-center gap-3`}>
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <p className={`text-xl font-bold ${c.text} leading-none`}>{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
};

const Badge = ({ isAdmin, isVerified, role }) => {
  const roleColors = {
    student: "bg-blue-50 text-blue-700 border-blue-200",
    faculty: "bg-indigo-50 text-indigo-700 border-indigo-200",
    admin: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {/* System role (student | faculty | admin) */}
      {role && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${roleColors[role] || "bg-slate-100 text-slate-500 border-slate-200"}`}
        >
          {role === "faculty" ? (
            <Users className="w-2.5 h-2.5" />
          ) : role === "admin" ? (
            <Shield className="w-2.5 h-2.5" />
          ) : (
            <User className="w-2.5 h-2.5" />
          )}
          {role}
        </span>
      )}
      {/* isAdmin flag */}
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isAdmin === "admin"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-slate-100 text-slate-500 border-slate-200"
        }`}
      >
        {isAdmin === "admin" ? <Crown className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
        {isAdmin === "admin" ? "Site Admin" : "Regular"}
      </span>
      {/* Verification */}
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
        }`}
      >
        {isVerified ? <CheckCircle className="w-2.5 h-2.5" /> : <Ban className="w-2.5 h-2.5" />}
        {isVerified ? "Verified" : "Unverified"}
      </span>
    </div>
  );
};

// Pagination
const Pagination = ({ page, totalPages, total, limit, onPageChange, onLimitChange }) => {
  const pages = () => {
    const delta = 1;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const arr = [1];
    if (left > 2) arr.push("...");
    for (let i = left; i <= right; i++) arr.push(i);
    if (right < totalPages - 1) arr.push("...");
    if (totalPages > 1) arr.push(totalPages);
    return arr;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Rows:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LIMITS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {total > 0 ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}` : "0 records"}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {pages().map((p, i) =>
            p === "..." ? (
              <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Slide Panel (right drawer) ────────────────────────────────────────────────
const SlidePanel = ({ isOpen, onClose, title, subtitle, children }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
     <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.26, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500 flex-shrink-0">
            <div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              {subtitle && <p className="text-blue-100 text-xs mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
  );
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  title,
  message,
  confirmLabel,
  confirmColor = "bg-red-600 hover:bg-red-700",
  icon: Icon = Trash2,
  iconBg = "bg-red-100",
  iconColor = "text-red-600",
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
        >
          <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h3 className="text-center font-bold text-slate-800 text-base">{title}</h3>
          <p className="text-center text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`flex-1 py-3 ${confirmColor} text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ManageUsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = SUPER_ADMINS.includes(currentUser?.email);

  // ── Table state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    verified: 0,
    unverified: 0,
    regular: 0,
  });

  // ── Panel / Dialog state ───────────────────────────────────────────────────
  const [viewPanel, setViewPanel] = useState(false);
  const [editPanel, setEditPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null); // "delete"|"makeAdmin"|"removeAdmin"|"verify"|"unverify"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // ── Edit form ──────────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    isAdmin: "user",
    isVerified: false,
    role: "student",
  });

  // ── Dropdown per row ──────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch users (server-side paginated) ───────────────────────────────────
  const fetchUsers = useCallback(
    async (pg = 1, lim = 10, q = "", f = "all") => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: pg, limit: lim });
        if (q) params.set("search", q);

        // Apply the filter params from the option map
        const filterOption = FILTER_OPTIONS.find((o) => o.value === f);
        if (filterOption?.param) {
          Object.entries(filterOption.param).forEach(([k, v]) => params.set(k, v));
        }

        const res = await fetch(`${API_URL}/api/auth/fetchallusers?${params}`, {
          headers: buildAuthHeaders(currentUser._id),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch users");

        setUsers(data.users || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.stats) setStats(data.stats);
      } catch (err) {
        toast.error(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [currentUser?._id],
  );

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers(page, limit, search, filter);
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, limit, search, filter);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // ── Filter change ──────────────────────────────────────────────────────────
  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
    setFilterOpen(false);
    fetchUsers(1, limit, search, val);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchUsers(p, limit, search, filter);
  };
  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    fetchUsers(1, l, search, filter);
  };
  const refresh = () => fetchUsers(page, limit, search, filter);

  // ── Guard: super-admin-only actions ───────────────────────────────────────
  const guardSuper = () => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can perform this action");
      return false;
    }
    return true;
  };

  // ── Generic user update (POST /api/auth/update-user) ──────────────────────
  const updateUser = async (userId, payload) => {
    const res = await fetch(`${API_URL}/api/auth/update-user`, {
      method: "POST",
      headers: buildAuthHeaders(currentUser._id),
      body: JSON.stringify({ userId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");
    return data;
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!guardSuper()) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/delete-user`, {
        method: "POST",
        headers: buildAuthHeaders(currentUser._id),
        body: JSON.stringify({ userId: selected._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success(`${selected.name} deleted`);
      setDialog(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Make/Remove Admin ──────────────────────────────────────────────────────
  const handleToggleAdmin = async () => {
    if (!guardSuper()) return;
    const making = dialog === "makeAdmin";
    setIsSubmitting(true);
    setActionError("");
    try {
      await updateUser(selected._id, { isAdmin: making ? "admin" : "user" });
      toast.success(`${selected.name} ${making ? "is now an admin" : "admin removed"}`);
      setDialog(null);
      setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, isAdmin: making ? "admin" : "user" } : u)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Verify/Unverify ────────────────────────────────────────────────────────
  const handleToggleVerify = async () => {
    if (!guardSuper()) return;
    const verifying = dialog === "verify";
    setIsSubmitting(true);
    setActionError("");
    try {
      await updateUser(selected._id, { isVerified: verifying });
      toast.success(`${selected.name} ${verifying ? "verified" : "unverified"}`);
      setDialog(null);
      setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, isVerified: verifying } : u)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit (save) ────────────────────────────────────────────────────────────
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!guardSuper()) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      await updateUser(selected._id, {
        name: editForm.name,
        email: editForm.email,
        isAdmin: editForm.isAdmin,
        isVerified: editForm.isVerified,
        role: editForm.role,
      });
      toast.success("User updated successfully");
      setEditPanel(false);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selected._id
            ? {
                ...u,
                name: editForm.name,
                email: editForm.email,
                isAdmin: editForm.isAdmin,
                isVerified: editForm.isVerified,
                role: editForm.role,
              }
            : u,
        ),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (usr) => {
    setSelected(usr);
    setEditForm({
      name: usr.name,
      email: usr.email,
      isAdmin: usr.isAdmin,
      isVerified: usr.isVerified,
      role: usr.role || "student",
    });
    setActionError("");
    setEditPanel(true);
    setOpenDropdown(null);
  };

  const openView = (usr) => {
    setSelected(usr);
    setViewPanel(true);
    setOpenDropdown(null);
  };

  const openDialog = (type, usr) => {
    setSelected(usr);
    setDialog(type);
    setActionError("");
    setOpenDropdown(null);
  };

  // ── Dialog config map ──────────────────────────────────────────────────────
  const dialogConfig = {
    delete: {
      title: "Delete User",
      message: `Are you sure you want to permanently delete "${selected?.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: "bg-red-600 hover:bg-red-700",
      icon: Trash2,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      onConfirm: handleDelete,
    },
    makeAdmin: {
      title: "Grant Admin Access",
      message: `Make "${selected?.name}" an administrator? They will have full system access.`,
      confirmLabel: "Make Admin",
      confirmColor: "bg-amber-600 hover:bg-amber-700",
      icon: Crown,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      onConfirm: handleToggleAdmin,
    },
    removeAdmin: {
      title: "Remove Admin Access",
      message: `Remove admin privileges from "${selected?.name}"? They will become a regular user.`,
      confirmLabel: "Remove Admin",
      confirmColor: "bg-indigo-600 hover:bg-indigo-700",
      icon: UserX,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      onConfirm: handleToggleAdmin,
    },
    verify: {
      title: "Verify User",
      message: `Verify "${selected?.name}"'s account? This confirms their identity.`,
      confirmLabel: "Verify",
      confirmColor: "bg-emerald-600 hover:bg-emerald-700",
      icon: UserCheck,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      onConfirm: handleToggleVerify,
    },
    unverify: {
      title: "Unverify User",
      message: `Remove verification from "${selected?.name}"? Their verified status will be revoked.`,
      confirmLabel: "Unverify",
      confirmColor: "bg-orange-600 hover:bg-orange-700",
      icon: Ban,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      onConfirm: handleToggleVerify,
    },
  };

  const activeDlg = dialog ? dialogConfig[dialog] : null;

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Users", value: stats.total ?? total, icon: Users, color: "blue" },
    { label: "Admins", value: stats.admins ?? 0, icon: Crown, color: "amber" },
    { label: "Regular Users", value: stats.regular ?? 0, icon: User, color: "indigo" },
    { label: "Verified", value: stats.verified ?? 0, icon: UserCheck, color: "emerald" },
    { label: "Unverified", value: stats.unverified ?? 0, icon: ShieldAlert, color: "red" },
    { label: "Students", value: stats.students ?? 0, icon: GraduationCap, color: "blue" },
    { label: "Faculty", value: stats.faculty ?? 0, icon: BookOpen, color: "indigo" },
  ];

  // ── Inline field for input ─────────────────────────────────────────────────
  const inputCls =
    "w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Admin · User Management
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Users</h1>
          <p className="text-sm text-slate-400 mt-1">View, edit and control all registered accounts</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 text-sm font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700 text-sm">
            All Users
            <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {total}
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full sm:w-64 pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen((p) => !p)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all w-full sm:w-auto justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  {FILTER_OPTIONS.find((f) => f.value === filter)?.label || "All Users"}
                </div>
                <ChevronLeft
                  className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-90" : "-rotate-90"}`}
                />
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden"
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleFilterChange(opt.value)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          filter === opt.value ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "User", "Email", "Role & Status", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 opacity-30" />
                      </div>
                      <p className="text-sm font-semibold">No users found</p>
                      <p className="text-xs opacity-70">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {users.map((usr, idx) => (
                    <motion.tr
                      key={usr._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* # */}
                      <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">{(page - 1) * limit + idx + 1}</td>

                      {/* User */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 ${getAvatarColor(usr._id)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
                          >
                            <span className="text-white text-xs font-bold">{getInitials(usr.name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{usr.name}</p>
                            {usr.isAdmin === "admin" && (
                              <span className="text-[10px] text-amber-600 font-semibold">Administrator</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-5 text-sm text-slate-500 truncate max-w-[180px]">{usr.email}</td>

                      {/* Role & Status */}
                      <td className="py-3.5 px-5">
                        <Badge isAdmin={usr.isAdmin} isVerified={usr.isVerified} role={usr.role} />
                      </td>

                      {/* Joined */}
                      <td className="py-3.5 px-5 text-sm text-slate-400">
                        {usr.createdAt
                          ? new Date(usr.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5">
                        <div className="relative" ref={openDropdown === usr._id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === usr._id ? null : usr._id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {openDropdown === usr._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden"
                              >
                                {/* View */}
                                <button
                                  onClick={() => openView(usr)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-slate-400" /> View Details
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => openEdit(usr)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-400" /> Edit User
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                {/* Make/Remove Admin */}
                                {usr.isAdmin !== "admin" ? (
                                  <button
                                    onClick={() => openDialog("makeAdmin", usr)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                                  >
                                    <Crown className="w-4 h-4" /> Make Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openDialog("removeAdmin", usr)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  >
                                    <UserX className="w-4 h-4" /> Remove Admin
                                  </button>
                                )}

                                {/* Verify/Unverify */}
                                {!usr.isVerified ? (
                                  <button
                                    onClick={() => openDialog("verify", usr)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  >
                                    <UserCheck className="w-4 h-4" /> Verify User
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openDialog("unverify", usr)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                  >
                                    <Ban className="w-4 h-4" /> Unverify User
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1" />

                                {/* Delete */}
                                <button
                                  onClick={() => openDialog("delete", usr)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete User
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* ══════════════ VIEW PANEL ══════════════ */}
      <SlidePanel
        isOpen={viewPanel}
        onClose={() => setViewPanel(false)}
        title="User Details"
        subtitle={selected?.email}
      >
        {selected && (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className={`w-20 h-20 ${getAvatarColor(selected._id)} rounded-2xl flex items-center justify-center shadow-md`}
              >
                <span className="text-white text-2xl font-bold">{getInitials(selected.name)}</span>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800 text-lg">{selected.name}</h3>
                <p className="text-slate-400 text-sm">{selected.email}</p>
              </div>
              <Badge isAdmin={selected.isAdmin} isVerified={selected.isVerified} role={selected.role} />
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { icon: Hash, label: "User ID", value: selected._id, mono: true },
                { icon: Crown, label: "Role", value: selected.isAdmin === "admin" ? "Administrator" : "Regular User" },
                {
                  icon: Shield,
                  label: "System Role",
                  value: selected?.role ? selected.role.charAt(0).toUpperCase() + selected.role.slice(1) : "—",
                },
                { icon: ShieldCheck, label: "Verified", value: selected.isVerified ? "Yes" : "No" },
                {
                  icon: Calendar,
                  label: "Joined",
                  value: selected.createdAt
                    ? new Date(selected.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })
                    : "—",
                },
                {
                  icon: TrendingUp,
                  label: "Last Login",
                  value: selected.lastLogin ? new Date(selected.lastLogin).toLocaleString("en-IN") : "—",
                },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p
                      className={`text-sm font-semibold text-slate-700 mt-0.5 break-all ${mono ? "font-mono text-xs" : ""}`}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions from view */}
            {isSuperAdmin && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setViewPanel(false);
                      openEdit(selected);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setViewPanel(false);
                      openDialog("delete", selected);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {selected.isAdmin !== "admin" ? (
                    <button
                      onClick={() => {
                        setViewPanel(false);
                        openDialog("makeAdmin", selected);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" /> Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setViewPanel(false);
                        openDialog("removeAdmin", selected);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" /> Remove Admin
                    </button>
                  )}
                  {!selected.isVerified ? (
                    <button
                      onClick={() => {
                        setViewPanel(false);
                        openDialog("verify", selected);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Verify
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setViewPanel(false);
                        openDialog("unverify", selected);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Unverify
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>

      {/* ══════════════ EDIT PANEL ══════════════ */}
      <SlidePanel isOpen={editPanel} onClose={() => setEditPanel(false)} title="Edit User" subtitle={selected?.name}>
        <form onSubmit={handleEditSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              className={inputCls}
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="email"
              className={inputCls}
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">System Role</label>
            <select
              className={`${inputCls} appearance-none cursor-pointer`}
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="isVerified"
              checked={editForm.isVerified}
              onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <label
              htmlFor="isVerified"
              className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Mark as Verified
            </label>
          </div>

          {actionError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium">{actionError}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* ══════════════ CONFIRM DIALOGS ══════════════ */}
      {activeDlg && (
        <ConfirmDialog
          isOpen={!!dialog}
          onClose={() => {
            setDialog(null);
            setActionError("");
          }}
          onConfirm={activeDlg.onConfirm}
          isSubmitting={isSubmitting}
          title={activeDlg.title}
          message={activeDlg.message}
          confirmLabel={activeDlg.confirmLabel}
          confirmColor={activeDlg.confirmColor}
          icon={activeDlg.icon}
          iconBg={activeDlg.iconBg}
          iconColor={activeDlg.iconColor}
        />
      )}
    </div>
  );
};

export default ManageUsersPage;
