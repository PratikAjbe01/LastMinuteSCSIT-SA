import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
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
  BookOpen,
  Users,
  GraduationCap,
  Award,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../store/authStore";
import { API_URL } from "../../../../utils/urls";
import { useFetch } from "../../hooks/useFetch";

const LIMITS = [9, 18, 36];

const getAvatarColor = (id = "") => {
  const colors = [
    "bg-gradient-to-br from-cyan-500 to-cyan-600",
    "bg-gradient-to-br from-sky-500 to-sky-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
    "bg-gradient-to-br from-violet-500 to-violet-600",
  ];
  return colors[id.charCodeAt(id.length - 1) % colors.length];
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    cyan: { bg: "bg-gradient-to-br from-cyan-50 to-cyan-100/50", text: "text-cyan-700", icon: "text-cyan-600", border: "border-cyan-200/50", iconBg: "bg-cyan-100" },
    sky: { bg: "bg-gradient-to-br from-sky-50 to-sky-100/50", text: "text-sky-700", icon: "text-sky-600", border: "border-sky-200/50", iconBg: "bg-sky-100" },
    indigo: { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/50", text: "text-indigo-700", icon: "text-indigo-600", border: "border-indigo-200/50", iconBg: "bg-indigo-100" },
    violet: { bg: "bg-gradient-to-br from-violet-50 to-violet-100/50", text: "text-violet-700", icon: "text-violet-600", border: "border-violet-200/50", iconBg: "bg-violet-100" },
  };
  const c = colors[color] || colors.cyan;

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
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="text-sm border border-slate-300 rounded-xl px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
          {LIMITS.map((l) => (<option key={l} value={l}>{l}</option>))}
        </select>
        <span className="text-sm text-slate-600 font-medium">
          {total > 0 ? <><span className="text-slate-800 font-semibold">{(page - 1) * limit + 1}</span> – <span className="text-slate-800 font-semibold">{Math.min(page * limit, total)}</span> of <span className="text-slate-800 font-semibold">{total}</span></> : "0 records"}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages().map((p, i) => p === "..." ? (<span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>) : (
            <button key={p} onClick={() => onPageChange(p)} className={`min-w-[36px] h-9 rounded-xl text-sm font-semibold transition-all ${p === page ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-cyan-200 scale-105" : "border border-slate-300 text-slate-700 hover:bg-cyan-50"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-cyan-50 disabled:opacity-40 disabled:cursor-not-allowed">
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
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-cyan-600 via-cyan-600 to-sky-600">
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              {subtitle && <p className="text-cyan-100 text-sm mt-0.5">{subtitle}</p>}
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

const DepartmentsPage = () => {
  const { user } = useAuthStore();
    const { fetchInstance } = useFetch();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({ total: 0, withClasses: 0, withSubjects: 0, withStudents: 0 });

  const [viewPanel, setViewPanel] = useState(false);
  const [createPanel, setCreatePanel] = useState(false);
  const [editPanel, setEditPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: "" });
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

  const fetchDepartments = useCallback(async (pg = 1, lim = 9, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: lim });
      if (q) params.set("search", q);

      const res = await fetchInstance.get(`/admin/departments?${params}`);
      setDepartments(res.departments || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);

      setStats({
        total: res.departments.length,
        withClasses: res.departments.filter(d => d.classCount > 0).length,
        withSubjects: res.departments.filter(d => d.subjectCount > 0).length,
        withStudents: res.departments.filter(d => d.studentCount > 0).length,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    if (user?._id) fetchDepartments(page, limit, search);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchDepartments(1, limit, search);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handlePageChange = (p) => {
    setPage(p);
    fetchDepartments(p, limit, search);
  };

  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    fetchDepartments(1, l, search);
  };

  const refresh = () => fetchDepartments(page, limit, search);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.post(`/admin/departments`, { formData });
      toast.success("Department created successfully");
      setCreatePanel(false);
      setFormData({ name: "" });
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to create department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.put(`/admin/departments/${selected._id}`, { formData });
      toast.success("Department updated successfully");
      setEditPanel(false);
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetchInstance.delete(`/admin/departments/${selected._id}`);
      toast.success("Department deleted successfully");
      setDialog(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = (dept) => {
    setSelected(dept);
    setViewPanel(true);
    setOpenDropdown(null);
  };

  const openEdit = (dept) => {
    setSelected(dept);
    setFormData({ name: dept.name });
    setEditPanel(true);
    setOpenDropdown(null);
  };

  const openDelete = (dept) => {
    setSelected(dept);
    setDialog("delete");
    setOpenDropdown(null);
  };

  const statCards = [
    { label: "Total Departments", value: stats.total, icon: Building2, color: "cyan" },
    { label: "With Classes", value: stats.withClasses, icon: BookOpen, color: "sky" },
    { label: "With Subjects", value: stats.withSubjects, icon: Award, color: "indigo" },
    { label: "With Students", value: stats.withStudents, icon: GraduationCap, color: "violet" },
  ];

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 hover:border-slate-400 transition-all placeholder:text-slate-400";

  return (
    <>
      <Helmet>
        <title>Admin - Manage Departments</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-sky-50/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider bg-cyan-100 px-3 py-1 rounded-full">
                  Admin · Departments
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Manage Departments</h1>
              <p className="text-sm text-slate-600 mt-2 font-medium">Create, edit and organize departments</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreatePanel(true)} className="inline-flex items-center gap-2.5 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                <PlusCircle className="w-4 h-4" /> Add New
              </button>
              <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-700 hover:text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 text-sm font-semibold shadow-sm transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-500" : ""}`} /> Refresh
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s) => (<StatCard key={s.label} {...s} />))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/30">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                All Departments <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-3 py-1 rounded-full">{total}</span>
              </h2>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." className="w-full sm:w-72 pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 hover:border-slate-400 transition-all placeholder:text-slate-400 font-medium" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-all">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading departments...</p>
                  </div>
                </div>
              ) : departments.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                    <Building2 className="w-10 h-10 opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-600 mb-1">No departments found</p>
                    <p className="text-sm opacity-70">Create your first department to get started</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {departments.map((dept, idx) => (
                      <motion.div key={dept._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.2) }} className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all relative group hover:border-cyan-300">
                        <div className="absolute top-4 right-4" ref={openDropdown === dept._id ? dropdownRef : null}>
                          <button onClick={() => setOpenDropdown(openDropdown === dept._id ? null : dept._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {openDropdown === dept._id && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-44 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-30 overflow-hidden">
                                <button onClick={() => openView(dept)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button onClick={() => openEdit(dept)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-cyan-50">
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => openDelete(dept)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-14 h-14 ${getAvatarColor(dept._id)} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <Building2 className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-800 text-base truncate group-hover:text-cyan-600 transition-colors">{dept.name}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{dept.totalCount || 0} Total Entries</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 text-center border border-blue-200/50">
                            <BookOpen className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <p className="text-lg font-black text-blue-700">{dept.classCount || 0}</p>
                            <p className="text-[10px] text-blue-600 font-semibold">Classes</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 text-center border border-purple-200/50">
                            <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                            <p className="text-lg font-black text-purple-700">{dept.subjectCount || 0}</p>
                            <p className="text-[10px] text-purple-600 font-semibold">Subjects</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 text-center border border-emerald-200/50">
                            <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <p className="text-lg font-black text-emerald-700">{dept.studentCount || 0}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold">Students</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {!loading && departments.length > 0 && (
              <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
            )}
          </motion.div>
        </div>
      </div>

      <SlidePanel isOpen={viewPanel} onClose={() => setViewPanel(false)} title="Department Details">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-6 bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl">
              <div className={`w-24 h-24 ${getAvatarColor(selected._id)} rounded-3xl flex items-center justify-center shadow-xl`}>
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900 text-xl">{selected.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{selected.totalCount || 0} Total Entries</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-blue-700">{selected.classCount || 0}</p>
                <p className="text-xs text-blue-600 font-bold mt-1">Classes</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-purple-700">{selected.subjectCount || 0}</p>
                <p className="text-xs text-purple-600 font-bold mt-1">Subjects</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center border-2 border-emerald-200">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-black text-emerald-700">{selected.studentCount || 0}</p>
                <p className="text-xs text-emerald-600 font-bold mt-1">Students</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-xl border border-slate-200">
                <Hash className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Department ID</p>
                  <p className="text-xs font-mono font-bold text-slate-800 break-all">{selected._id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>

      <SlidePanel isOpen={createPanel} onClose={() => !isSubmitting && setCreatePanel(false)} title="Create New Department">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Computer Science" />
          </div>
          <div className="pt-4 border-t-2 border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Create Department</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      <SlidePanel isOpen={editPanel} onClose={() => !isSubmitting && setEditPanel(false)} title="Edit Department">
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input required className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="pt-4 border-t-2 border-slate-200">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
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
          title="Delete Department"
          message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
          confirmLabel="Delete Department"
          confirmColor="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          icon={Trash2}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      )}
    </>
  );
};

export default DepartmentsPage;