import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Eye, Filter, Calendar, Clock, Users, UserCheck, UserX,
  CheckCircle, TrendingUp, BookOpen, GraduationCap, Building2,
  BarChart3, Download, Activity,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../store/authStore";
import { useFetch } from "../../hooks/useFetch";

// ── Constants & Helpers ───────────────────────────────────────────────────────
const LIMITS = [10, 20, 50];

const getAvatarColor = (id = "default") => {
  const colors = [
    "bg-emerald-600", "bg-teal-600", "bg-blue-600", "bg-indigo-600", "bg-violet-600"
  ];
  return colors[id.charCodeAt(id.length - 1) % colors.length];
};

const TAB_COLORS = {
  emerald: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-600" },
  teal:    { bg: "bg-teal-600",    text: "text-teal-700",    border: "border-teal-200",    badge: "bg-teal-50 text-teal-600" },
  blue:    { bg: "bg-blue-600",    text: "text-blue-700",    border: "border-blue-200",    badge: "bg-blue-50 text-blue-600" },
  violet:  { bg: "bg-violet-600",  text: "text-violet-700",  border: "border-violet-200",  badge: "bg-violet-50 text-violet-600" },
};

// ── Reusable: Stat Card ───────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, subtitle }) => {
  const c = TAB_COLORS[color] || TAB_COLORS.emerald;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.text} leading-none`}>{value || 0}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// ── Reusable: Pagination ──────────────────────────────────────────────────────
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
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    ? "bg-emerald-600 text-white shadow-sm"
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

// ── Reusable: Slide-over Global Panel ─────────────────────────────────────────
const SlidePanel = ({ isOpen, onClose, title, subtitle, icon: Icon, children, wide }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className={`relative ${wide ? 'w-full max-w-4xl' : 'w-full max-w-md'} bg-white shadow-2xl flex flex-col h-full overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-500 flex-shrink-0">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  {subtitle && <p className="text-emerald-100 text-xs mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── Main ReportsPage Component ────────────────────────────────────────────────
const ReportsPage = () => {
  const { user } = useAuthStore();
  const { fetchInstance } = useFetch();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, avgAttendance: 0 });

  const [viewPanel, setViewPanel] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const searchTimeout = useRef(null);

  // Fetch Session List
  const fetchSessions = useCallback(async (pg = 1, lim = 10, q = "", status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: lim });
      if (q) params.set("search", q);
      if (status) params.set("status", status);

      const res = await fetchInstance.get(`/admin/sessions?${params}`);
      
      const fetchedSessions = res?.sessions || [];
      setSessions(fetchedSessions);
      setTotal(res?.pagination?.total || 0);
      setTotalPages(res?.pagination?.totalPages || 1);

      setStats({
        total: fetchedSessions.length,
        completed: fetchedSessions.filter(s => s.status === 'completed').length,
        active: fetchedSessions.filter(s => s.status === 'active').length,
        avgAttendance: fetchedSessions.length > 0 
          ? Math.round(fetchedSessions.reduce((acc, s) => acc + (s.attendeeCount || 0), 0) / fetchedSessions.length)
          : 0,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [fetchInstance]);

  // Fetch Specific Session Details
  const fetchSessionDetails = async (sessionId) => {
    setDetailsLoading(true);
    try {
      const res = await fetchInstance.get(`/admin/sessions/${sessionId}`);
      // Save entire response to properly access nested ledgers/activity logs
      setSessionDetails(res);
    } catch (err) {
      toast.error(err.message || "Failed to load session details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSessions(page, limit, search, statusFilter);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchSessions(1, limit, search, statusFilter);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
    setFilterOpen(false);
    fetchSessions(1, limit, search, val);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchSessions(p, limit, search, statusFilter);
  };

  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    fetchSessions(1, l, search, statusFilter);
  };

  const refresh = () => fetchSessions(page, limit, search, statusFilter);

  const openView = async (session) => {
    setViewPanel(true);
    await fetchSessionDetails(session._id);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (percentage >= 75) return "text-blue-700 bg-blue-50 border-blue-200";
    if (percentage >= 60) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const handleExportCSV = () => {
    if (!sessions || sessions.length === 0) {
      toast.error("No sessions available to export.");
      return;
    }

    // 1. Define CSV headers
    const headers = [
      "Session ID",
      "Subject Name",
      "Subject Code",
      "Class Name",
      "Faculty Name",
      "Date",
      "Start Time",
      "Duration (Mins)",
      "Status",
      "Present Count"
    ];

    // 2. Map data to rows
    const csvRows = sessions.map(session => {
      return [
        session._id || "",
        `"${session.subjectName || ""}"`, // Wrapped in quotes in case of internal commas
        `"${session.subjectCode || ""}"`,
        `"${session.className || ""}"`,
        `"${session.facultyName || ""}"`,
        session.date ? new Date(session.date).toLocaleDateString('en-IN') : "",
        session.startTime ? new Date(session.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "",
        session.durationMinutes || "",
        session.status || "",
        session.attendeeCount || 0
      ].join(",");
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Create Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.setAttribute("download", `Admin_Sessions_Report_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported successfully!");
  };

  const statCards = [
    { label: "Total Sessions", value: stats.total, icon: ClipboardList, color: "emerald" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "teal" },
    { label: "Active", value: stats.active, icon: Activity, color: "blue" },
    { label: "Avg Attendance", value: stats.avgAttendance, icon: TrendingUp, color: "violet", subtitle: "Attendees per session" },
  ];

  const filterOptions = [
    { value: "", label: "All Statuses" },
    { value: "active", label: "Active Sessions" },
    { value: "completed", label: "Completed Sessions" },
  ];

  return (
    <>
      <Helmet>
        <title>Admin - Attendance Reports</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Attendance Reports
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Comprehensive attendance analytics and session records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              All Sessions 
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {total} Records
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative max-w-sm w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Search sessions..." 
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400" 
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative">
                <button onClick={() => setFilterOpen((p) => !p)} className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span>{filterOptions.find(f => f.value === statusFilter)?.label || "All Statuses"}</span>
                  </div>
                  <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${filterOpen ? "rotate-90" : "-rotate-90"}`} />
                </button>
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                      {filterOptions.map((opt) => (
                        <button key={opt.value} onClick={() => handleFilterChange(opt.value)} className={`w-full text-left px-4 py-2.5 text-sm transition-all ${statusFilter === opt.value ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#", "Subject", "Class", "Faculty", "Date", "Duration", "Attendance", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Loading sessions...</p>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">No sessions found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {sessions.map((session, idx) => (
                      <motion.tr key={session._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">{(page - 1) * limit + idx + 1}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{session.subjectName || "—"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{session.subjectCode || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-slate-600 font-semibold">{session.className || "—"}</td>
                        <td className="py-3.5 px-5 text-sm text-slate-500">{session.facultyName || "—"}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{session.date ? new Date(session.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.durationMinutes ? `${session.durationMinutes} min` : '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{session.attendeeCount || 0}</span>
                            {session.maxAttendees && <span className="text-xs text-slate-400">/ {session.maxAttendees}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${session.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {session.status === 'active' ? <Activity className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {session.status || "Unknown"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button onClick={() => openView(session)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
        </div>
      </div>

      {/* Slide Panel for Session Details */}
      <SlidePanel isOpen={viewPanel} onClose={() => setViewPanel(false)} title="Session Report" icon={ClipboardList} wide>
        {detailsLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Fetching session details...</p>
          </div>
        ) : sessionDetails ? (
          <div className="space-y-6 pb-6">
            
            {/* Header & Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Info Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-start gap-5 mb-6">
                  <div className={`w-16 h-16 ${getAvatarColor(sessionDetails?.session?._id)} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-2xl">{sessionDetails?.session?.subject?.name || "Unknown Subject"}</h3>
                    <p className="text-sm text-slate-500 font-semibold mt-1">
                      {sessionDetails?.session?.class?.name || "Unknown Class"} 
                      {sessionDetails?.session?.class?.section && ` • ${sessionDetails.session.class.section}`}
                    </p>
                    <div className="flex flex-wrap gap-2.5 mt-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${sessionDetails?.session?.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {sessionDetails?.session?.status === 'active' ? <Activity className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {(sessionDetails?.session?.status || "Unknown").toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Building2 className="w-3.5 h-3.5" />
                        {sessionDetails?.session?.class?.department || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Faculty Lead</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{sessionDetails?.session?.faculty?.name || "N/A"}</p>
                      <p className="text-xs text-slate-500 truncate">{sessionDetails?.session?.faculty?.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Schedule</p>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {sessionDetails?.session?.date ? new Date(sessionDetails.session.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {sessionDetails?.session?.startTime ? new Date(sessionDetails.session.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Stats Card Container */}
              <div className="flex flex-col gap-4">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
                  <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-5xl font-black text-emerald-700">{sessionDetails?.session?.presentCount || 0}</p>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-1">Present</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-2xl p-5 border border-red-100 text-center shadow-sm">
                    <p className="text-3xl font-black text-red-700">{sessionDetails?.session?.absentCount || 0}</p>
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1">Absent</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center shadow-sm">
                    <p className="text-3xl font-black text-blue-700">{sessionDetails?.session?.attendancePercentage || 0}%</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Present List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[420px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex-shrink-0">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    Present Students ({sessionDetails?.session?.attendees?.length || 0})
                  </h4>
                </div>
                <div className="overflow-y-auto p-3 flex-1">
                  {sessionDetails?.session?.attendees?.length > 0 ? (
                    <div className="space-y-1.5">
                      {sessionDetails.session.attendees.map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-700 text-xs font-bold">
                              {attendee?.student?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{attendee?.student?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500 font-mono">{attendee?.student?.rollNumber || "N/A"}</p>
                          </div>
                          <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                            {attendee?.markedAt ? new Date(attendee.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <UserCheck className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-semibold">No students marked present.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Absent List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[420px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex-shrink-0">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <UserX className="w-4 h-4 text-red-500" />
                    Absent Students ({sessionDetails?.session?.absentCount || 0})
                  </h4>
                </div>
               <div className="overflow-y-auto p-3 flex-1">
                  {sessionDetails?.session?.class?.students?.filter(student => !sessionDetails.session.attendees?.some(a => a?.student?._id === student?._id))?.length > 0 ? (
                    <div className="space-y-1.5">
                      {sessionDetails.session.class.students
                        .filter(student => !sessionDetails.session.attendees?.some(a => a?.student?._id === student?._id))
                        .map((student, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-slate-500 text-xs font-bold">
                                {student?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{student?.name || "Unknown"}</p>
                              <p className="text-xs text-slate-500 font-mono">{student?.rollNumber || "N/A"}</p>
                            </div>
                            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-md">
                              ABSENT
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <UserX className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-semibold">No absent students recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Ledger Table */}
            {sessionDetails?.ledgers?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Overall Student Ledger
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Attended</th>
                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Total</th>
                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sessionDetails.ledgers.map((ledger, idx) => {
                        const percentage = ledger?.totalClasses > 0 ? Math.round((ledger.attended / ledger.totalClasses) * 100) : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-5">
                              <p className="text-sm font-bold text-slate-800">{ledger?.student?.name || "Unknown"}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{ledger?.student?.rollNumber || "N/A"}</p>
                            </td>
                            <td className="py-3 px-5 text-sm font-bold text-emerald-600 text-center">{ledger?.attended || 0}</td>
                            <td className="py-3 px-5 text-sm font-bold text-slate-600 text-center">{ledger?.totalClasses || 0}</td>
                            <td className="py-3 px-5 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border ${getAttendanceColor(percentage)}`}>
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity Log */}
            {sessionDetails?.session?.activityLog?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex-shrink-0">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-blue-500" />
                    System Activity Log
                  </h4>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                  <div className="space-y-5">
                    {sessionDetails.session.activityLog.map((log, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_#eff6ff]" />
                        <div className="-mt-1">
                          <p className="text-sm font-bold text-slate-800">{log?.action || "System Action"}</p>
                          {log?.detail && <p className="text-xs text-slate-600 mt-1">{log.detail}</p>}
                          <p className="text-[10px] text-slate-400 mt-1.5 font-mono font-medium">
                            {log?.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="py-24 text-center text-slate-400">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-semibold text-slate-600">No session details available.</p>
            <p className="text-sm mt-1">Data might have been deleted or is currently inaccessible.</p>
          </div>
        )}
      </SlidePanel>
    </>
  );
};

export default ReportsPage;