// src/features/smart-attendance/pages/faculty/FacultyReports.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Search, History,
  FileBarChart, RefreshCw, Calendar, Users,
  TrendingUp, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, BookOpen
} from "lucide-react";
import { formatDate, getAttendanceColor } from "../../utils/helpers";
import { useFetch } from "../../hooks/useFetch";
import toast from "react-hot-toast";

// ── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange, total, label = "records" }) => {
  if (totalPages <= 1) return (
    <p className="text-xs text-slate-400 text-center py-2">{total} {label}</p>
  );
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-xs text-slate-400">{total} {label} · Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
          const p = startPage + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                p === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Attendance Badge ─────────────────────────────────────────────────────────
const AttendanceBadge = ({ percentage }) => {
  const pct = parseFloat(percentage) || 0;
  if (pct >= 75) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
      <CheckCircle className="w-3 h-3" /> {pct.toFixed(1)}%
    </span>
  );
  if (pct >= 50) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
      <AlertCircle className="w-3 h-3" /> {pct.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
      <AlertCircle className="w-3 h-3" /> {pct.toFixed(1)}%
    </span>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const SESSIONS_LIMIT = 8;
const LEDGER_LIMIT   = 10;

const FacultyReports = () => {
  const { fetchInstance } = useFetch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("sessions");
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  // Sessions state
  const [sessions, setSessions]         = useState([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1);
  const [sessionsTotal, setSessionsTotal]           = useState(0);

  // Ledger state
  const [ledger, setLedger]           = useState([]);
  const [ledgerPage, setLedgerPage]   = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTotal, setLedgerTotal]           = useState(0);

  useEffect(() => {
    if (activeTab === "sessions") loadSessions(1, search);
    else loadLedger(1, search);
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === "sessions") loadSessions(1, search);
      else loadLedger(1, search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadSessions = async (page, q = "") => {
    setLoading(true);
    try {
      // GET /faculty/sessions?page=&limit=&search=
      const res = await fetchInstance.get("/faculty/sessions", {
        page,
        limit: SESSIONS_LIMIT,
        search: q,
      });
      setSessions(res?.sessions || res?.data?.sessions || []);
      setSessionsTotalPages(res?.pagination?.totalPages || res?.totalPages || 1);
      setSessionsTotal(res?.pagination?.total || res?.total || 0);
      setSessionsPage(page);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (page, q = "") => {
    setLoading(true);
    try {
      // GET /faculty/reports?page=&limit=&search=
      const res = await fetchInstance.get("/faculty/reports", {
        page,
        limit: LEDGER_LIMIT,
        search: q,
      });
      setLedger(res?.reports || res?.data?.reports || []);
      setLedgerTotalPages(res?.pagination?.totalPages || res?.totalPages || 1);
      setLedgerTotal(res?.pagination?.total || res?.total || 0);
      setLedgerPage(page);
    } catch {
      toast.error("Failed to load attendance ledger");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (session) => {
    const headers = "Student Name,Roll Number,Email,Department,Marked Time\n";
    const rows = (session.attendees || []).map((a) =>
      `"${a.student?.name || ""}","${a.student?.rollNumber || ""}","${a.student?.email || ""}","${a.student?.department || ""}","${a.markedAtTime || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `Session_${session.subject?.code || "export"}_${formatDate(session.date)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Analytics</p>
            <h1 className="text-xl font-bold text-slate-800">Reports & Attendance</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => { setActiveTab("sessions"); setSearch(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "sessions"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            Session History
          </button>
          <button
            onClick={() => { setActiveTab("ledger"); setSearch(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "ledger"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            Master Ledger
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={activeTab === "sessions" ? "Search by class or subject..." : "Search by student name or roll number..."}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all placeholder:text-slate-400"
        />
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400 font-medium">Loading records...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "sessions" ? (
              <motion.div
                key="sessions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No sessions found</p>
                    <p className="text-xs mt-1 opacity-70">Start an attendance session to see it here</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                            <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class / Subject</th>
                            <th className="text-center py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Present</th>
                            <th className="text-right py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Export</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sessions.map((session) => (
                            <tr key={session._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                    <span className="text-[9px] font-bold text-blue-500 uppercase leading-none">
                                      {new Date(session.date).toLocaleString("default", { month: "short" })}
                                    </span>
                                    <span className="text-sm font-bold text-blue-700 leading-none">
                                      {new Date(session.date).getDate()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">{formatDate(session.date)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <p className="text-sm font-semibold text-slate-700">{session.subject?.name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                    {session.class?.name}
                                  </span>
                                  {session.class?.section && (
                                    <span className="text-xs text-slate-400">· {session.class.section}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                                  <Users className="w-3 h-3" />
                                  {session.attendeeCount || 0} present
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => exportCSV(session)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" /> Export CSV
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-slate-100">
                      <Pagination
                        page={sessionsPage}
                        totalPages={sessionsTotalPages}
                        total={sessionsTotal}
                        label="sessions"
                        onPageChange={(p) => loadSessions(p, search)}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="ledger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {ledger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <FileBarChart className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No attendance records</p>
                    <p className="text-xs mt-1 opacity-70">Records appear after marking attendance</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                            <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                            <th className="text-left py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No.</th>
                            <th className="text-center py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                            <th className="text-right py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {ledger.map((rec, idx) => (
                            <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-6 text-sm text-slate-400 font-medium">
                                {(ledgerPage - 1) * LEDGER_LIMIT + idx + 1}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-indigo-600 text-xs font-bold">
                                      {rec.studentName?.charAt(0)?.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">{rec.studentName}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-mono text-blue-600 font-semibold">{rec.rollNumber}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        rec.percentage >= 75 ? "bg-emerald-500"
                                        : rec.percentage >= 50 ? "bg-amber-400"
                                        : "bg-red-400"
                                      }`}
                                      style={{ width: `${Math.min(rec.percentage, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                    {rec.attended} / {rec.totalClasses}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <AttendanceBadge percentage={rec.percentage} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-slate-100">
                      <Pagination
                        page={ledgerPage}
                        totalPages={ledgerTotalPages}
                        total={ledgerTotal}
                        label="records"
                        onPageChange={(p) => loadLedger(p, search)}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FacultyReports;