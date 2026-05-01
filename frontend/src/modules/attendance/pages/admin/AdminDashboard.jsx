// src/features/smart-attendance/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, Building2, Plus, Search,
  Trash2, UserPlus, RefreshCw, ChevronLeft,
  ChevronRight, Shield, TrendingUp, Activity,
  GraduationCap, X, Check, AlertCircle,
  MoreVertical, Edit2, Eye, Filter,
  BookMarked, Layers, BarChart3
} from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../store/authStore";
import { motion as m } from "framer-motion";
import { createPortal } from "react-dom";

// ── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "students", label: "Students",  icon: GraduationCap, color: "blue"    },
  { id: "faculty",  label: "Faculty",   icon: Users,         color: "indigo"  },
  { id: "subjects", label: "Subjects",  icon: BookMarked,    color: "emerald" },
  { id: "classes",  label: "Classes",   icon: Layers,        color: "violet"  },
];

const LIMITS = [10, 20, 50];

const TAB_COLORS = {
  blue:   { bg: "bg-blue-600",   light: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700"   },
  indigo: { bg: "bg-indigo-600", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  emerald:{ bg: "bg-emerald-600",light: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700"},
  violet: { bg: "bg-violet-600", light: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
};

// ── Reusable: Pagination ─────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, limit, onPageChange, onLimitChange }) => {
  const pageNumbers = () => {
    const delta = 2;
    const range = [];
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
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
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
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
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Reusable: Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sublabel, trend }) => {
  const c = TAB_COLORS[color] || TAB_COLORS.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${c.text} leading-none`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  );
};

// ── Reusable: Form Field ─────────────────────────────────────────────────────
const FormField = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-600 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400";
const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ── Reusable: Slide-over Panel Modal ─────────────────────────────────────────
const SlidePanel = ({ isOpen, onClose, title, subtitle, icon: Icon, children }) => {
  // Safety check for SSR/Browser environment
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          {/* Slide Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500 flex-shrink-0">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  {subtitle && <p className="text-blue-100 text-xs mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body // Teleports the entirely animated tree to the root level
  );
};

// ── Reusable: Confirm Delete Dialog ─────────────────────────────────────────
const ConfirmDialog = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          
          {/* Dialog Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-center font-bold text-slate-800 text-base">Delete Record</h3>
            <p className="text-center text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-700">{itemName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body // Teleports the entirely animated tree to the root level
  );
};

// ── Avatar Chip ───────────────────────────────────────────────────────────────
const AvatarChip = ({ name, color = "blue" }) => {
  const c = TAB_COLORS[color] || TAB_COLORS.blue;
  return (
    <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="text-white text-xs font-bold">{name?.charAt(0)?.toUpperCase() || "?"}</span>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, label }) => (
  <tr>
    <td colSpan={10} className="py-20">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Icon className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-sm font-semibold">No {label} found</p>
        <p className="text-xs opacity-70">Try adjusting your search or add a new entry</p>
      </div>
    </td>
  </tr>
);

// ── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user }          = useAuthStore();
  const { fetchInstance } = useFetch();

  // ── Global state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState("students");
  const [stats, setStats]           = useState({ totalStudents: 0, totalFaculty: 0, totalClasses: 0, totalSubjects: 0, activeSessions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Table state ───────────────────────────────────────────────────────────
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const searchTimeout           = useRef(null);

  // ── Supporting data for selects ──────────────────────────────────────────
  const [allSubjects, setAllSubjects] = useState([]);
  const [allFaculty,  setAllFaculty]  = useState([]);

  // ── Panels & dialogs ─────────────────────────────────────────────────────
  const [panel, setPanel]           = useState(null); // "student" | "faculty" | "subject" | "class" | "assign"
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Forms ─────────────────────────────────────────────────────────────────
  const [studentForm, setStudentForm] = useState({ name: "", email: "", password: "", rollNumber: "", department: "" });
  const [facultyForm, setFacultyForm] = useState({ name: "", email: "", password: "", department: "", phone: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", department: "", credits: "" });
  const [classForm,   setClassForm]   = useState({ name: "", semester: "", section: "", department: "" });
  const [assignForm,  setAssignForm]  = useState({ facultyId: "", subjectId: "" });
  const [assignTarget, setAssignTarget] = useState(null);

  // ── API path map ──────────────────────────────────────────────────────────
  const apiPath = {
    students: "/admin/students",
    faculty:  "/admin/faculty",
    subjects: "/admin/subjects",
    classes:  "/admin/classes",
  };

  // ── Load dashboard stats ──────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // GET /admin/dashboard
      const res = await fetchInstance.get("/admin/dashboard");
      setStats(res?.stats || {});
    } catch {
      // stats fail silently — table data is primary
    } finally {
      setStatsLoading(false);
    }
  }, [fetchInstance]);

  // ── Load supporting data once ─────────────────────────────────────────────
  const loadSupporting = useCallback(async () => {
    try {
      const [subRes, facRes] = await Promise.all([
        fetchInstance.get("/admin/subjects", { limit: 1000 }), // Increased limit
        fetchInstance.get("/admin/faculty",  { limit: 1000 }), // Increased limit
      ]);
      setAllSubjects(subRes?.subjects || []);
      setAllFaculty(facRes?.faculty   || []);
    } catch { /* silent */ }
  }, [fetchInstance]);

  // ── Load tab data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async (tab, pg, lim, q) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: lim };
      if (q) params.search = q;

      const res = await fetchInstance.get(apiPath[tab], params);
      const key  = tab === "faculty" ? "faculty" : tab;
      setData(res?.[key] || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotal(res?.pagination?.total || 0);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchInstance]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { loadStats(); loadSupporting(); }, []);

  useEffect(() => {
    setPage(1);
    setSearch("");
    loadData(activeTab, 1, limit, "");
  }, [activeTab]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadData(activeTab, 1, limit, search);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handlePageChange = (p) => {
    setPage(p);
    loadData(activeTab, p, limit, search);
  };

  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    loadData(activeTab, 1, l, search);
  };

  const refresh = () => loadData(activeTab, page, limit, search);

  // ── Create handlers ───────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formMap = { students: studentForm, faculty: facultyForm, subjects: subjectForm, classes: classForm };
      const form    = formMap[activeTab];

      await fetchInstance.post(apiPath[activeTab], form);
      toast.success(`${TABS.find(t => t.id === activeTab)?.label.slice(0,-1) || "Record"} created successfully`);
      setPanel(null);
      resetForms();
      loadSupporting();
      loadStats();
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetchInstance.delete(`${apiPath[activeTab]}/${deleteTarget._id}`);
      toast.success("Record deleted successfully");
      setDeleteTarget(null);
      loadStats();
      loadSupporting();
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Assign faculty handler ────────────────────────────────────────────────
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTarget) return;
    setSubmitting(true);
    try {
      const updatedAssignments = [
        ...(assignTarget.assignments || []),
        { faculty: assignForm.facultyId, subject: assignForm.subjectId },
      ];
      // PUT /admin/classes/:id
      await fetchInstance.put(`/admin/classes/${assignTarget._id}`, {
        assignments: updatedAssignments,
      });
      toast.success("Faculty assigned successfully");
      setPanel(null);
      setAssignForm({ facultyId: "", subjectId: "" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Enroll student handler ────────────────────────────────────────────────
  const handleEnroll = async (classId, studentId) => {
    try {
      // POST /admin/classes/:id/enroll
      await fetchInstance.post(`/admin/classes/${classId}/enroll`, { studentId });
      toast.success("Student enrolled");
      refresh();
    } catch (err) {
      toast.error(err.message || "Enrollment failed");
    }
  };

  const resetForms = () => {
    setStudentForm({ name: "", email: "", password: "", rollNumber: "", department: "" });
    setFacultyForm({ name: "", email: "", password: "", department: "", phone: "" });
    setSubjectForm({ name: "", code: "", department: "", credits: "" });
    setClassForm({ name: "", semester: "", section: "", department: "" });
  };

  const openCreatePanel = () => {
    resetForms();
    setEditTarget(null);
    const panelMap = { students: "student", faculty: "faculty", subjects: "subject", classes: "class" };
    setPanel(panelMap[activeTab]);
  };

  const activeTabConfig = TABS.find((t) => t.id === activeTab);
  const activeColor     = activeTabConfig?.color || "blue";
  const c               = TAB_COLORS[activeColor];

  // ── Stat cards config ─────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Students", value: stats.totalStudents  || 0, icon: GraduationCap, color: "blue",    sublabel: "Active learners" },
    { label: "Faculty Members", value: stats.totalFaculty  || 0, icon: Users,         color: "indigo",  sublabel: "Teaching staff" },
    { label: "Active Classes",  value: stats.totalClasses  || 0, icon: Layers,        color: "violet",  sublabel: "Running sessions" },
    { label: "Subjects",        value: stats.totalSubjects || 0, icon: BookMarked,    color: "emerald", sublabel: "In curriculum" },
    { label: "Live Sessions",   value: stats.activeSessions || 0, icon: Activity,     color: "blue",    sublabel: "Right now" },
  ];

  // ── Table column config ───────────────────────────────────────────────────
  const columns = {
    students: ["#", "Name", "Email", "Roll No.", "Department", "Actions"],
    faculty:  ["#", "Name", "Email", "Department", "Phone", "Actions"],
    subjects: ["#", "Subject Name", "Code", "Department", "Credits", "Actions"],
    classes:  ["#", "Class Name", "Semester", "Section", "Department", "Assignments", "Actions"],
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Admin Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, <span className="text-blue-600">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your institution's data from one place
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadStats(); refresh(); }}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
          <button
            onClick={openCreatePanel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md hover:shadow-blue-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add {activeTabConfig?.label.slice(0, -1) || "Record"}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Card Header: Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100">

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 overflow-x-auto flex-shrink-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const tc       = TAB_COLORS[tab.color];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? `${tc.bg} text-white shadow-sm`
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTabConfig?.label.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns[activeTab].map((col) => (
                  <th
                    key={col}
                    className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Loading records...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <EmptyState icon={activeTabConfig?.icon || Users} label={activeTabConfig?.label?.toLowerCase() || "records"} />
              ) : (
                <AnimatePresence>
                  {data.map((item, idx) => (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.025, 0.25) }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Row number */}
                      <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* ── Students ── */}
                      {activeTab === "students" && <>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <AvatarChip name={item.name} color="blue" />
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                              {item.isActive === false && (
                                <span className="text-[10px] text-red-500 font-medium">Inactive</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">{item.email}</td>
                        <td className="py-3.5 px-5">
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold">
                            {item.rollNumber || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {item.department || "—"}
                          </span>
                        </td>
                      </>}

                      {/* ── Faculty ── */}
                      {activeTab === "faculty" && <>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <AvatarChip name={item.name} color="indigo" />
                            <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">{item.email}</td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {item.department || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-400 font-mono">{item.phone || "—"}</td>
                      </>}

                      {/* ── Subjects ── */}
                      {activeTab === "subjects" && <>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <AvatarChip name={item.name} color="emerald" />
                            <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
                            {item.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {item.department || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">
                          {item.credits ? `${item.credits} credits` : "—"}
                        </td>
                      </>}

                      {/* ── Classes ── */}
                      {activeTab === "classes" && <>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <AvatarChip name={item.name} color="violet" />
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.students?.length || 0} students</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full font-semibold">
                            Sem {item.semester}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">{item.section || "—"}</td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">{item.department || "—"}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {!item.assignments?.length ? (
                              <span className="text-xs text-slate-400 italic">No assignments</span>
                            ) : item.assignments.map((a, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
                              >
                                {a.faculty?.name?.split(" ")[0]} · {a.subject?.code}
                              </span>
                            ))}
                          </div>
                        </td>
                      </>}

                      {/* Actions */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          {activeTab === "classes" && (
                            <button
                              onClick={() => { setAssignTarget(item); setAssignForm({ facultyId: "", subjectId: "" }); setPanel("assign"); }}
                              className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                              title="Assign Faculty"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ══════════════════════════════════════════════════
          SLIDE PANELS
      ══════════════════════════════════════════════════ */}

      {/* Add Student */}
      <SlidePanel
        isOpen={panel === "student"}
        onClose={() => setPanel(null)}
        title="Add New Student"
        subtitle="Create a student account"
        icon={GraduationCap}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Full Name" required>
            <input required className={inputCls} placeholder="e.g. John Smith"
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
          </FormField>
          <FormField label="Email Address" required>
            <input required type="email" className={inputCls} placeholder="john@college.edu"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
          </FormField>
          <FormField label="Password" required>
            <input required type="password" className={inputCls} placeholder="Min. 8 characters"
              value={studentForm.password}
              onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Roll Number">
              <input className={inputCls} placeholder="e.g. CS2021001"
                value={studentForm.rollNumber}
                onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })} />
            </FormField>
            <FormField label="Department">
              <input className={inputCls} placeholder="e.g. CSE"
                value={studentForm.department}
                onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })} />
            </FormField>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Student</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Add Faculty */}
      <SlidePanel
        isOpen={panel === "faculty"}
        onClose={() => setPanel(null)}
        title="Add New Faculty"
        subtitle="Create a faculty account"
        icon={Users}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Full Name" required>
            <input required className={inputCls} placeholder="e.g. Dr. Jane Doe"
              value={facultyForm.name}
              onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} />
          </FormField>
          <FormField label="Email Address" required>
            <input required type="email" className={inputCls} placeholder="jane@college.edu"
              value={facultyForm.email}
              onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} />
          </FormField>
          <FormField label="Password" required>
            <input required type="password" className={inputCls} placeholder="Min. 8 characters"
              value={facultyForm.password}
              onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department">
              <input className={inputCls} placeholder="e.g. CSE"
                value={facultyForm.department}
                onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })} />
            </FormField>
            <FormField label="Phone">
              <input className={inputCls} placeholder="+91 XXXXX XXXXX"
                value={facultyForm.phone}
                onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })} />
            </FormField>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Faculty</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Add Subject */}
      <SlidePanel
        isOpen={panel === "subject"}
        onClose={() => setPanel(null)}
        title="Add New Subject"
        subtitle="Register a new subject in curriculum"
        icon={BookMarked}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Subject Name" required>
            <input required className={inputCls} placeholder="e.g. Data Structures"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
          </FormField>
          <FormField label="Subject Code" required>
            <input required className={inputCls} placeholder="e.g. CS301"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department">
              <input className={inputCls} placeholder="e.g. CSE"
                value={subjectForm.department}
                onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })} />
            </FormField>
            <FormField label="Credits">
              <input type="number" min="1" max="10" className={inputCls} placeholder="e.g. 4"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })} />
            </FormField>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Subject</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Add Class */}
      <SlidePanel
        isOpen={panel === "class"}
        onClose={() => setPanel(null)}
        title="Add New Class"
        subtitle="Create a new classroom node"
        icon={Layers}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormField label="Class Name" required>
            <input required className={inputCls} placeholder="e.g. CS-A"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Semester" required>
              <input required type="number" min="1" max="12" className={inputCls} placeholder="e.g. 5"
                value={classForm.semester}
                onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })} />
            </FormField>
            <FormField label="Section">
              <input className={inputCls} placeholder="e.g. A"
                value={classForm.section}
                onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Department">
            <input className={inputCls} placeholder="e.g. Computer Science"
              value={classForm.department}
              onChange={(e) => setClassForm({ ...classForm, department: e.target.value })} />
          </FormField>
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Class</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Assign Faculty to Class */}
      <SlidePanel
        isOpen={panel === "assign"}
        onClose={() => { setPanel(null); setAssignTarget(null); }}
        title="Assign Faculty"
        subtitle={assignTarget ? `Assigning to ${assignTarget.name}` : ""}
        icon={UserPlus}
      >
        {assignTarget && (
          <div className="mb-6 p-4 bg-violet-50 border border-violet-100 rounded-xl">
            <div className="flex items-center gap-3">
              <AvatarChip name={assignTarget.name} color="violet" />
              <div>
                <p className="font-semibold text-violet-800 text-sm">{assignTarget.name}</p>
                <p className="text-xs text-violet-500">
                  Semester {assignTarget.semester} · {assignTarget.students?.length || 0} students enrolled
                </p>
              </div>
            </div>
            {assignTarget.assignments?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-violet-100">
                <p className="text-xs font-semibold text-violet-600 mb-2">Current Assignments:</p>
                <div className="flex flex-wrap gap-1.5">
                  {assignTarget.assignments.map((a, i) => (
                    <span key={i} className="text-[10px] bg-white text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
                      {a.faculty?.name?.split(" ")[0]} · {a.subject?.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-5">
          <FormField label="Select Faculty" required>
            <select required className={selectCls}
              value={assignForm.facultyId}
              onChange={(e) => setAssignForm({ ...assignForm, facultyId: e.target.value })}
            >
              <option value="">Choose a faculty member...</option>
              {allFaculty.map((f) => (
                <option key={f._id} value={f._id}>{f.name} — {f.department || "General"}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Select Subject" required>
            <select required className={selectCls}
              value={assignForm.subjectId}
              onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
            >
              <option value="">Choose a subject...</option>
              {allSubjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </FormField>

          {assignForm.facultyId && assignForm.subjectId && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                {allFaculty.find(f => f._id === assignForm.facultyId)?.name} will teach{" "}
                {allSubjects.find(s => s._id === assignForm.subjectId)?.name}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning...</> : <><UserPlus className="w-4 h-4" /> Confirm Assignment</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name || deleteTarget?.rollNumber || "this record"}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminDashboard;