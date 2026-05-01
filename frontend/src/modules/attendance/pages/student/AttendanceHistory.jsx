// src/features/smart-attendance/pages/student/AttendanceHistory.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Calendar, CheckCircle,
  Search, X, ChevronLeft, ChevronRight,
  RefreshCw, Filter, TrendingUp, Clock,
  ChevronDown, LayoutGrid, List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, limit, onPageChange, onLimitChange }) => {
  if (totalPages <= 1 && total <= limit) return (
    <p className="text-xs text-slate-400 text-center py-3">{total} record{total !== 1 ? "s" : ""}</p>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-slate-400">Per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 20, 50].map((l) => <option key={l} value={l}>{l}</option>)}
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
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {p}
              </button>
            );
          })}
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

// ── Heatmap ───────────────────────────────────────────────────────────────────
const Heatmap = ({ markedDates }) => {
  const today     = new Date();
  const year      = today.getFullYear();
  const month     = today.getMonth();
  const days      = new Date(year, month + 1, 0).getDate();
  const firstDay  = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString("default", { month: "long" });

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">{monthName} {year}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
            <span className="text-[10px] text-slate-400 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-[10px] text-slate-400 font-medium">Present</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = new Date(year, month, day).toISOString().split("T")[0];
          const marked  = markedDates.includes(dateStr);
          const isToday = day === today.getDate();

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: day * 0.008 }}
              title={marked ? `Present on ${dateStr}` : `Absent on ${dateStr}`}
              className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold cursor-default transition-all ${
                marked
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : isToday
                  ? "bg-blue-50 text-blue-600 border-2 border-blue-300"
                  : "bg-slate-50 text-slate-400 border border-slate-100"
              }`}
            >
              {day}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ── Subject Detail View ───────────────────────────────────────────────────────
const SubjectDetail = ({ subject, sessions, onBack }) => {
  const pct    = sessions.length > 0
    ? Math.round((sessions.length / Math.max(sessions.length, 1)) * 100)
    : 0;
  const dates  = sessions.map((s) => new Date(s.date).toISOString().split("T")[0]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-bold text-slate-800 text-base">{subject}</h2>
          <p className="text-xs text-slate-400">{sessions.length} sessions attended</p>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <Heatmap markedDates={dates} />
      </div>

      {/* Session list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm">Session Records</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {sessions.map((s, idx) => (
            <div key={s._id || idx} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{s.class || "—"}</p>
                <p className="text-xs text-slate-400">{s.faculty || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-600">{formatDate(s.date)}</p>
                {s.markedAt && (
                  <p className="text-[10px] text-slate-400">
                    {new Date(s.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AttendanceHistory = () => {
  const { fetchInstance } = useFetch();
  const navigate          = useNavigate();

  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(10);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewMode, setViewMode]         = useState("list"); // "list" | "subject"
  const searchTimeout                   = useRef(null);

  const loadHistory = useCallback(async (pg, lim, q = "") => {
    setLoading(true);
    try {
      // GET /student/attendance-history?page=&limit=&search=
      const res = await fetchInstance.get("/student/attendance-history", {
        page: pg, limit: lim, ...(q ? { search: q } : {}),
      });
      setHistory(res?.history || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotal(res?.pagination?.total || res?.history?.length || 0);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [fetchInstance]);

  useEffect(() => { loadHistory(1, limit, ""); }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadHistory(1, limit, search);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handlePageChange  = (p)  => { setPage(p);  loadHistory(p, limit, search); };
  const handleLimitChange = (l)  => { setLimit(l); setPage(1); loadHistory(1, l, search); };

  // Group by subject for subject view
  const subjectGroups = history.reduce((acc, s) => {
    const key = s.subject || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const subjectKeys = Object.keys(subjectGroups);

  const subjectDetail = selectedSubject
    ? { name: selectedSubject, sessions: subjectGroups[selectedSubject] || [] }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-5">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => {
            if (selectedSubject) { setSelectedSubject(null); return; }
            navigate(-1);
          }}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Student</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {selectedSubject ? selectedSubject : "Attendance History"}
          </h1>
        </div>
      </motion.div>

      {/* ── Subject detail view ── */}
      <AnimatePresence mode="wait">
        {selectedSubject && subjectDetail ? (
          <SubjectDetail
            key="detail"
            subject={subjectDetail.name}
            sessions={subjectDetail.sessions}
            onBack={() => setSelectedSubject(null)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject or class..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder:text-slate-400"
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

              {/* View toggle */}
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button
                  onClick={() => setViewMode("subject")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "subject" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> By Subject
                </button>
              </div>
            </div>

            {/* ── List View ── */}
            {viewMode === "list" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                  {["Subject", "Class", "Faculty", "Date", "Status"].map((h) => (
                    <p key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</p>
                  ))}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No attendance records</p>
                    <p className="text-xs mt-1 opacity-70">
                      {search ? "Try a different search term" : "Your records will appear after scanning QR codes"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {history.map((record, idx) => (
                        <motion.div
                          key={record._id || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                          className="px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Mobile layout */}
                          <div className="sm:hidden flex items-start gap-3">
                            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{record.subject}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{record.class} · {record.faculty}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs text-slate-500">{formatDate(record.date)}</p>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                                  Present
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Desktop layout */}
                          <div className="hidden sm:grid grid-cols-5 gap-4 items-center">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-[10px] font-bold">
                                  {record.subject?.charAt(0) || "S"}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{record.subject}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{record.subjectCode || "—"}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 truncate">{record.class || "—"}</p>
                            <p className="text-sm text-slate-500 truncate">{record.faculty || "—"}</p>
                            <p className="text-sm text-slate-600 font-medium">{formatDate(record.date)}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full w-fit">
                              <CheckCircle className="w-3 h-3" /> Present
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            )}

            {/* ── Subject Card Grid View ── */}
            {viewMode === "subject" && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : subjectKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-400">
                    <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No subjects found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subjectKeys.map((subjectName, idx) => {
                      const sessions = subjectGroups[subjectName];
                      const latest   = sessions[0];
                      return (
                        <motion.button
                          key={subjectName}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          onClick={() => setSelectedSubject(subjectName)}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 text-left group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                              <BookOpen className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>

                          <p className="font-bold text-slate-700 text-sm truncate">{subjectName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {sessions[0]?.subjectCode || "—"}
                          </p>

                          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
                            <div>
                              <p className="text-xl font-bold text-blue-600">{sessions.length}</p>
                              <p className="text-[10px] text-slate-400 font-medium">sessions</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-slate-600">
                                {latest ? formatDate(latest.date) : "—"}
                              </p>
                              <p className="text-[10px] text-slate-400">last attended</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceHistory;