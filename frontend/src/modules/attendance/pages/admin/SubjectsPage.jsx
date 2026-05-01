import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Filter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  Save,
  Hash,
  LayoutGrid,
  LayoutList,
  Building2,
  Award,
  Code,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../store/authStore";
import { API_URL } from "../../../../utils/urls";
import { useFetch } from "../../hooks/useFetch";

const LIMITS = [9, 18, 36];

const getAvatarColor = (id = "") => {
  const colors = [
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
  ];
  return colors[id.charCodeAt(id.length - 1) % colors.length];
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    purple: { bg: "bg-gradient-to-br from-purple-50 to-purple-100/50", text: "text-purple-700", icon: "text-purple-600", border: "border-purple-200/50", iconBg: "bg-purple-100" },
    pink: { bg: "bg-gradient-to-br from-pink-50 to-pink-100/50", text: "text-pink-700", icon: "text-pink-600", border: "border-pink-200/50", iconBg: "bg-pink-100" },
    teal: { bg: "bg-gradient-to-br from-teal-50 to-teal-100/50", text: "text-teal-700", icon: "text-teal-600", border: "border-teal-200/50", iconBg: "bg-teal-100" },
    orange: { bg: "bg-gradient-to-br from-orange-50 to-orange-100/50", text: "text-orange-700", icon: "text-orange-600", border: "border-orange-200/50", iconBg: "bg-orange-100" },
  };
  const c = colors[color] || colors.purple;

  return (
    <motion.div whileHover={{ y: -2, scale: 1.02 }} className={`${c.bg} rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-black ${c.text} leading-none`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-gradient-to-b from-slate-50/50 to-white">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500">Rows per page:</span>
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="text-sm border border-slate-300 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20">
          {LIMITS.map((l) => (<option key={l} value={l}>{l}</option>))}
        </select>
        <span className="text-sm text-slate-600 font-medium">
          {total > 0 ? <><span className="text-slate-800 font-semibold">{(page - 1) * limit + 1}</span> – <span className="text-slate-800 font-semibold">{Math.min(page * limit, total)}</span> of <span className="text-slate-800 font-semibold">{total}</span></> : "0 records"}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages().map((p, i) => p === "..." ? (<span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>) : (
            <button key={p} onClick={() => onPageChange(p)} className={`min-w-[36px] h-9 rounded-xl text-sm font-semibold transition-all ${p === page ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-purple-200 scale-105" : "border border-slate-300 text-slate-700 hover:bg-purple-50"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SlidePanel = ({ isOpen, onClose, title, subtitle, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600">
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              {subtitle && <p className="text-purple-100 text-sm mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/30 to-white">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ConfirmDialog = ({ isOpen, onClose, onConfirm, isSubmitting, title, message, confirmLabel, confirmColor = "bg-red-600 hover:bg-red-700", icon: Icon = Trash2, iconBg = "bg-red-100", iconColor = "text-red-600" }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10">
          <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <h3 className="text-center font-bold text-slate-900 text-xl mb-3">{title}</h3>
          <p className="text-center text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isSubmitting} className={`flex-1 py-3.5 ${confirmColor} text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md`}>
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SubjectsPage = () => {
  const { user } = useAuthStore();
    const { fetchInstance } = useFetch();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);

  const [stats, setStats] = useState({ total: 0, withDept: 0, withoutDept: 0, departments: 0 });
  const [departments, setDepartments] = useState([]);

  const [viewPanel, setViewPanel] = useState(false);
  const [createPanel, setCreatePanel] = useState(false);
  const [editPanel, setEditPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: "", code: "", department: "", credits: "3" });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSubjects = useCallback(async (pg = 1, lim = 9, q = "", dept = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: lim });
      if (q) params.set("search", q);
      if (dept) params.set("department", dept);

      const res = await fetchInstance.get(`/admin/subjects?${params}`);
      setSubjects(res.subjects || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);

      const depts = [...new Set(res.subjects.map(s => s.department).filter(Boolean))];
      setDepartments(depts);

      setStats({
        total: res.subjects.length,
        withDept: res.subjects.filter(s => s.department).length,
        withoutDept: res.subjects.filter(s => !s.department).length,
        departments: depts.length,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    if (user?._id) fetchSubjects(page, limit, search, departmentFilter);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchSubjects(1, limit, search, departmentFilter);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handleFilterChange = (val) => {
    setDepartmentFilter(val);
    setPage(1);
    setFilterOpen(false);
    fetchSubjects(1, limit, search, val);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchSubjects(p, limit, search, departmentFilter);
  };

  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    fetchSubjects(1, l, search, departmentFilter);
  };

  const refresh = () => fetchSubjects(page, limit, search, departmentFilter);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.post(`/admin/subjects`, { formData });
      toast.success("Subject created successfully");
      setCreatePanel(false);
      setFormData({ name: "", code: "", department: "", credits: "3" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to create subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.put(`/admin/subjects/${selected._id}`, { formData });
      toast.success("Subject updated successfully");
      setEditPanel(false);
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.delete(`/admin/subjects/${selected._id}`);
      toast.success("Subject deleted successfully");
      setDialog(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = (sub) => {
    setSelected(sub);
    setViewPanel(true);
    setOpenDropdown(null);
  };

  const openEdit = (sub) => {
    setSelected(sub);
    setFormData({
      name: sub.name,
      code: sub.code,
      department: sub.department || "",
      credits: sub.credits?.toString() || "3",
    });
    setEditPanel(true);
    setOpenDropdown(null);
  };

  const openDelete = (sub) => {
    setSelected(sub);
    setDialog("delete");
    setOpenDropdown(null);
  };

  const statCards = [
    { label: "Total Subjects", value: stats.total, icon: BookOpen, color: "purple" },
    { label: "With Department", value: stats.withDept, icon: Building2, color: "pink" },
    { label: "Unassigned", value: stats.withoutDept, icon: Code, color: "teal" },
    { label: "Departments", value: stats.departments, icon: Award, color: "orange" },
  ];

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-400 transition-all placeholder:text-slate-400";

  return (
    <>
      <Helmet>
        <title>Admin - Manage Subjects</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-100 px-3 py-1 rounded-full">
                  Admin · Subjects
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Manage Subjects</h1>
              <p className="text-sm text-slate-600 mt-2 font-medium">Create, edit and manage all subjects</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreatePanel(true)} className="inline-flex items-center gap-2.5 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                <PlusCircle className="w-4 h-4" /> Add New
              </button>
              <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-700 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 text-sm font-semibold shadow-sm transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-500" : ""}`} /> Refresh
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s) => (<StatCard key={s.label} {...s} />))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50/30">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                All Subjects <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{total}</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full sm:w-72 pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-400 transition-all placeholder:text-slate-400 font-medium" />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setFilterOpen((p) => !p)} className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all w-full sm:w-auto justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span>{departmentFilter || "All Departments"}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${filterOpen ? "rotate-90" : "-rotate-90"}`} />
                  </button>
                  <AnimatePresence>
                    {filterOpen && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-30 overflow-hidden">
                        <button onClick={() => handleFilterChange("")} className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all ${!departmentFilter ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-600" : "text-slate-700 hover:bg-slate-50"}`}>
                          All Departments
                        </button>
                        {departments.map((dept) => (
                          <button key={dept} onClick={() => handleFilterChange(dept)} className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all ${departmentFilter === dept ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-l-4 border-purple-600" : "text-slate-700 hover:bg-slate-50"}`}>
                            {dept}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-colors ${viewMode === "table" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 to-purple-50 border-b-2 border-slate-200">
                        {["#", "Code", "Subject Name", "Department", "Credits", "Actions"].map((h) => (
                          <th key={h} className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                              <p className="text-sm font-semibold text-slate-600">Loading subjects...</p>
                            </div>
                          </td>
                        </tr>
                      ) : subjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-24">
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                                <BookOpen className="w-10 h-10 opacity-40" />
                              </div>
                              <div className="text-center">
                                <p className="text-base font-bold text-slate-600 mb-1">No subjects found</p>
                                <p className="text-sm opacity-70">Create your first subject to get started</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <AnimatePresence>
                          {subjects.map((sub, idx) => (
                            <motion.tr key={sub._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 transition-all duration-200 group">
                              <td className="py-4 px-6 text-sm text-slate-500 font-semibold">{(page - 1) * limit + idx + 1}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono font-bold">
                                  <Code className="w-3.5 h-3.5" /> {sub.code}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{sub.name}</td>
                              <td className="py-4 px-6 text-sm text-slate-600 font-medium">{sub.department || "—"}</td>
                              <td className="py-4 px-6 text-sm text-slate-700 font-semibold">{sub.credits || "—"}</td>
                              <td className="py-4 px-6">
                                <div className="relative" ref={openDropdown === sub._id ? dropdownRef : null}>
                                  <button onClick={() => setOpenDropdown(openDropdown === sub._id ? null : sub._id)} className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-100 transition-all">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  <AnimatePresence>
                                    {openDropdown === sub._id && (
                                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-52 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-30 overflow-hidden">
                                        <button onClick={() => openView(sub)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                          <Eye className="w-4 h-4 text-slate-500" /> View Details
                                        </button>
                                        <button onClick={() => openEdit(sub)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-purple-50 transition-colors">
                                          <Edit2 className="w-4 h-4 text-purple-500" /> Edit Subject
                                        </button>
                                        <div className="border-t-2 border-slate-100" />
                                        <button onClick={() => openDelete(sub)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                          <Trash2 className="w-4 h-4" /> Delete Subject
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
                <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
              </>
            ) : (
              <>
                <div className="p-6">
                  {loading ? (
                    <div className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-slate-600">Loading subjects...</p>
                      </div>
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                        <BookOpen className="w-10 h-10 opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-slate-600 mb-1">No subjects found</p>
                        <p className="text-sm opacity-70">Create your first subject to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {subjects.map((sub, idx) => (
                          <motion.div key={sub._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.2) }} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4" ref={openDropdown === sub._id ? dropdownRef : null}>
                              <button onClick={() => setOpenDropdown(openDropdown === sub._id ? null : sub._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <AnimatePresence>
                                {openDropdown === sub._id && (
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-44 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-30 overflow-hidden">
                                    <button onClick={() => openView(sub)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    <button onClick={() => openEdit(sub)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-purple-50">
                                      <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => openDelete(sub)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-12 h-12 ${getAvatarColor(sub._id)} rounded-xl flex items-center justify-center shadow-md`}>
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-mono font-bold mb-1">{sub.code}</span>
                                <h3 className="font-bold text-slate-800 text-sm truncate">{sub.name}</h3>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {sub.department && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-medium">{sub.department}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Award className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{sub.credits || "—"} Credits</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {!loading && subjects.length > 0 && (
                  <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      <SlidePanel isOpen={viewPanel} onClose={() => setViewPanel(false)} title="Subject Details">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-6 bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl">
              <div className={`w-24 h-24 ${getAvatarColor(selected._id)} rounded-3xl flex items-center justify-center shadow-xl`}>
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono font-bold mb-2">{selected.code}</span>
                <h3 className="font-bold text-slate-900 text-xl">{selected.name}</h3>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Hash, label: "Subject ID", value: selected._id, mono: true },
                { icon: Code, label: "Subject Code", value: selected.code },
                { icon: Building2, label: "Department", value: selected.department || "—" },
                { icon: Award, label: "Credits", value: selected.credits || "—" },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl border border-slate-200">
                  <Icon className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-sm font-bold text-slate-800 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SlidePanel>

      <SlidePanel isOpen={createPanel} onClose={() => !isSubmitting && setCreatePanel(false)} title="Create New Subject">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Data Structures" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Subject Code <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., CS101" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Department</label>
              <input className={inputCls} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., CSE" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Credits</label>
              <input type="number" className={inputCls} value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} placeholder="3" />
            </div>
          </div>
          <div className="pt-4 border-t-2 border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Create Subject</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      <SlidePanel isOpen={editPanel} onClose={() => !isSubmitting && setEditPanel(false)} title="Edit Subject">
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Subject Code <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Department</label>
              <input className={inputCls} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Credits</label>
              <input type="number" className={inputCls} value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 border-t-2 border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {dialog === "delete" && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDialog(null)}
          onConfirm={handleDelete}
          isSubmitting={isSubmitting}
          title="Delete Subject"
          message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
          confirmLabel="Delete Subject"
          confirmColor="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          icon={Trash2}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      )}
    </>
  );
};

export default SubjectsPage;