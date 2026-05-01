// src/features/smart-attendance/pages/faculty/StartAttendancePage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, BookOpen, Users, ChevronDown, CheckCircle, AlertCircle,
  RefreshCw, Zap, PlayCircle, Clock, Calendar, Hash,
  Search, ChevronRight, Sparkles, Timer, Shield,
  ArrowRight, Radio, StopCircle, ChevronUp, Wifi,
} from "lucide-react";
import useAttendanceStore from "../../store/attendanceStore";
import { useFetch } from "../../hooks/useFetch";
import { useAuthStore } from "../../../../store/authStore";
import { API_URL } from "../../../../utils/urls";
import toast from "react-hot-toast";

const API_BASE = `${API_URL}/api/smart-attendance`;
const buildHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Normalize any value to a plain string for safe comparison
const str = (v) => (v?._id ?? v)?.toString() ?? "";

// ── Custom Dropdown ───────────────────────────────────────────────────────────
export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  searchable,
  renderOption,
  renderSelected,
}) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const wrapRef             = useRef(null);
  const searchRef           = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // focus search input when opening
  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, searchable]);

  const filtered = searchable && query.trim()
    ? options.filter((o) =>
        o.label?.toLowerCase().includes(query.toLowerCase()) ||
        o.searchText?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // find selected by string-safe comparison
  const selected = options.find((o) => str(o.value) === str(value));

  const handleSelect = (optValue) => {
    onChange(str(optValue));   // always emit a plain string
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-sm
          transition-all outline-none
          ${disabled
            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
            : "bg-white border-slate-200 hover:border-blue-300 cursor-pointer"}
          ${open ? "border-blue-400 ring-2 ring-blue-100 shadow-sm" : ""}
        `}
      >
        <span className={`truncate ${selected ? "text-slate-800 font-medium" : "text-slate-400"}`}>
          {selected
            ? renderSelected
              ? renderSelected(selected)
              : selected.label
            : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200
                       rounded-xl shadow-xl shadow-slate-200/70 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm outline-none text-slate-700
                               placeholder:text-slate-400 min-w-0"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  No results found
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = str(opt.value) === str(value);
                  return (
                    <button
                      key={str(opt.value)}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        hover:bg-blue-50 transition-colors !z-50
                        ${isSelected ? "bg-blue-50/70" : ""}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        {renderOption
                          ? renderOption(opt, isSelected)
                          : <span className="text-sm font-medium text-slate-700">{opt.label}</span>}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Live elapsed timer ────────────────────────────────────────────────────────
const useElapsed = (startTime) => {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startTime)) / 1000));
      const h    = Math.floor(diff / 3600);
      const m    = Math.floor((diff % 3600) / 60);
      const s    = diff % 60;
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
};

// ── Active Session Card ───────────────────────────────────────────────────────
const ActiveSessionCard = ({ session, onResume, onEnd, isResuming, isEnding }) => {
  const elapsed = useElapsed(session?.startTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
    >
      {/* animated top bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400
                      bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />

      <div className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500
                               rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Live Session
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 leading-tight truncate">
                {session.subjectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50
                          border border-emerald-100 rounded-lg flex-shrink-0">
            <Timer className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
              {elapsed}
            </span>
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            {
              icon: BookOpen, label: "Class",
              value: session.className,
            },
            {
              icon: Hash, label: "Session ID",
              value: session.sessionId?.slice(-8) || "—",
              mono: true,
            },
            {
              icon: Calendar, label: "Date",
              value: new Date(session.startTime || Date.now()).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              }),
            },
            {
              icon: Clock, label: "Started at",
              value: new Date(session.startTime || Date.now()).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit", hour12: true,
              }),
            },
          ].map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
              <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {label}
                </p>
                <p className={`text-xs font-semibold text-slate-700 truncate mt-0.5 ${mono ? "font-mono" : ""}`}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* attendee pill */}
        {session.attendeeCount !== undefined && (
          <div className="flex items-center gap-2 px-3 py-2 mb-4
                          bg-blue-50 border border-blue-100 rounded-xl">
            <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-700">
              {session.attendeeCount} student{session.attendeeCount !== 1 ? "s" : ""} marked present
            </p>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onResume}
            disabled={isResuming || isEnding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5
                       bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60
                       text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {isResuming
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resuming...</>
              : <><PlayCircle className="w-3.5 h-3.5" /> Resume Session</>}
          </button>
          <button
            onClick={onEnd}
            disabled={isEnding || isResuming}
            title="End session"
            className="flex items-center justify-center gap-2 px-4 py-2.5
                       bg-red-50 hover:bg-red-600 hover:text-white border border-red-200
                       text-red-600 font-semibold text-sm rounded-xl transition-all
                       disabled:opacity-50"
          >
            {isEnding
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <StopCircle className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Step badge ────────────────────────────────────────────────────────────────
const StepBadge = ({ n, done }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center
                   text-xs font-bold flex-shrink-0 transition-colors duration-300
                   ${done ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
    {done ? <CheckCircle className="w-3.5 h-3.5" /> : n}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const StartAttendancePage = () => {
  const { fetchInstance }     = useFetch();
  const { token }             = useAuthStore();
  const {
    startSession,
    isSessionActive,
    endSession: clearStore,
  } = useAttendanceStore();
  const navigate              = useNavigate();
  const newSessionRef         = useRef(null);

  // form state
  const [classes, setClasses]             = useState([]);
  const [selectedClassId, setSelectedClassId]     = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [loading, setLoading]             = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);

  // active session state
  const [activeSession, setActiveSession]     = useState(null);
  const [activeLoading, setActiveLoading]     = useState(true);
  const [isResuming, setIsResuming]           = useState(false);
  const [isEndingActive, setIsEndingActive]   = useState(false);

  // collapsible active-session section:
  // auto-open if session exists, auto-close if empty
  const [activeOpen, setActiveOpen] = useState(false);

  // redirect if store already tracks a live session
  useEffect(() => {
    if (isSessionActive) navigate("/smart/faculty/session");
  }, [isSessionActive, navigate]);

  useEffect(() => {
    loadClasses();
    fetchActiveSession();
  }, []);

  // open/close the active-session accordion based on data
  useEffect(() => {
    if (!activeLoading) setActiveOpen(!!activeSession);
  }, [activeSession, activeLoading]);

  // ── load classes ────────────────────────────────────────────────────────
  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await fetchInstance.get("/faculty/my-classes");
      const raw = res?.assignedClasses || res?.data?.assignedClasses || [];

      // Normalize subjects so _id is always a plain string
      const normalized = raw.map((cls) => ({
        ...cls,
        subjects: (cls.subjects || []).map((s) => ({
          // subject may be a populated object or a bare id string
          _id:  str(s),
          name: s?.name  || "Unknown",
          code: s?.code  || "—",
        })),
      }));

      setClasses(normalized);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setClassesLoading(false);
    }
  };

  // ── fetch active session from server ────────────────────────────────────
  const fetchActiveSession = useCallback(async () => {
    setActiveLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/faculty/sessions?status=active&limit=1`, {
        headers: buildHeaders(token),
      });
      const data = await res.json();
      const s    = data?.sessions?.[0];

      if (s) {
        setActiveSession({
          sessionId:     s._id,
          className:     s.class?.name
            ? `${s.class.name}${s.class.section ? " - " + s.class.section : ""}`
            : "Unknown Class",
          subjectName:   s.subject?.name || "Unknown Subject",
          startTime:     s.startTime,
          attendeeCount: s.attendeeCount ?? s.attendees?.length ?? 0,
        });
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    } finally {
      setActiveLoading(false);
    }
  }, [token]);

  // ── resume ──────────────────────────────────────────────────────────────
  const handleResume = useCallback(async () => {
    if (!activeSession) return;
    setIsResuming(true);
    try {
      startSession({
        sessionId:   activeSession.sessionId,
        className:   activeSession.className,
        subjectName: activeSession.subjectName,
        startTime:   activeSession.startTime,
      });
      toast.success("Session resumed");
      navigate("/smart/faculty/session");
    } catch {
      toast.error("Failed to resume session");
      setIsResuming(false);
    }
  }, [activeSession, startSession, navigate]);

  // ── end active session ──────────────────────────────────────────────────
  const handleEndActive = useCallback(async () => {
    if (!activeSession) return;
    if (!window.confirm("End this session? This action cannot be undone.")) return;
    setIsEndingActive(true);
    try {
      const res  = await fetch(`${API_BASE}/faculty/end-session`, {
        method:  "POST",
        headers: buildHeaders(token),
        body:    JSON.stringify({ sessionId: activeSession.sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        clearStore();
        setActiveSession(null);
        toast.success("Session ended successfully");
      } else {
        toast.error(data.message || "Failed to end session");
      }
    } catch {
      toast.error("Failed to end session");
    } finally {
      setIsEndingActive(false);
    }
  }, [activeSession, token, clearStore]);

  // ── start new session ───────────────────────────────────────────────────
  const handleStart = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error("Please select both a class and a subject");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchInstance.post("/faculty/start-session", {
        classId:   selectedClassId,
        subjectId: selectedSubjectId,
        durationMinutes: durationMinutes,
      });

      startSession({
        sessionId:   res?.session?._id,
        className:   selectedClass?.className   ?? "Unknown Class",
        subjectName: selectedSubject?.name      ?? "Unknown Subject",
        startTime:   res?.session?.startTime,
      });

      toast.success("Session started!");
      navigate("/smart/faculty/session");
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        // re-fetch so the active-session card is populated from the server
        await fetchActiveSession();
        toast.error("A session is already running — resume it in the section above");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(err?.message || "Failed to start session");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── derived values ──────────────────────────────────────────────────────
  const selectedClass = classes.find((c) => str(c.classId) === str(selectedClassId));

  // subjects from normalized list — _id is always a plain string now
  const selectedSubject = selectedClass?.subjects?.find(
    (s) => str(s._id) === str(selectedSubjectId)
  );

  const classOptions = classes.map((c) => ({
    value:      c.classId,
    label:      c.className,
    searchText: c.department,
    raw:        c,
  }));

  const subjectOptions = (selectedClass?.subjects ?? []).map((s) => ({
    value:      s._id,          // already a plain string after normalize
    label:      `${s.name} (${s.code})`,
    searchText: s.code,
    raw:        s,
  }));

  const formReady = !!selectedClassId && !!selectedSubjectId;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 pb-20">
      <div className="w-full max-w-xl mx-auto space-y-6">

        {/* ── Title ── */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14
                          bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Zap className="w-7 h-7 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Sessions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage live sessions or launch a new one
          </p>
        </div>

        {/* ── Active Session Accordion ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* accordion header */}
          <button
            type="button"
            onClick={() => setActiveOpen((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4
                       hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0
                ${activeLoading ? "bg-slate-300 animate-pulse"
                  : activeSession ? "bg-emerald-500 animate-pulse"
                  : "bg-slate-300"}`} />
              <span className="text-sm font-bold text-slate-700">Current Session</span>
              {!activeLoading && activeSession && (
                <span className="text-[10px] font-bold uppercase tracking-wider
                                 text-emerald-600 bg-emerald-50 border border-emerald-100
                                 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
              {!activeLoading && !activeSession && (
                <span className="text-[10px] font-semibold text-slate-400
                                 bg-slate-100 px-2 py-0.5 rounded-full">
                  None
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fetchActiveSession(); }}
                disabled={activeLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600
                           hover:bg-blue-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activeLoading ? "animate-spin" : ""}`} />
              </button>
              <motion.div animate={{ rotate: activeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>
            </div>
          </button>

          {/* accordion body */}
          <AnimatePresence initial={false}>
            {activeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {activeLoading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-sm text-slate-400">Checking for active sessions...</span>
                    </div>
                  ) : activeSession ? (
                    <ActiveSessionCard
                      session={activeSession}
                      onResume={handleResume}
                      onEnd={handleEndActive}
                      isResuming={isResuming}
                      isEnding={isEndingActive}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100
                                      flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          No active session
                        </p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          You have no running sessions right now.<br />
                          Create one using the form below.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          newSessionRef.current?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold
                                   text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Go to new session form
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            or start new
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ── New Session Card ── */}
        <div
          ref={newSessionRef}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm"
        >
          {/* gradient header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-white/80" />
                <p className="text-white font-bold text-sm">New Session</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1
                              bg-white/20 rounded-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white/90 text-xs font-semibold">QR Mode</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* step 1 — class */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <StepBadge n="1" done={!!selectedClassId} />
                <label className="text-sm font-semibold text-slate-700">Select Class</label>
              </div>

              {classesLoading ? (
                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-400">Loading your classes...</span>
                </div>
              ) : classes.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-700 font-medium">
                    No classes assigned yet
                  </span>
                </div>
              ) : (
                <CustomSelect
                  options={classOptions}
                  value={selectedClassId}
                  placeholder="Choose a classroom..."
                  searchable
                  onChange={(val) => {
                    setSelectedClassId(val);
                    setSelectedSubjectId(""); // reset subject on class change
                    setDurationMinutes(15);
                  }}
                  renderOption={(opt) => (
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {opt.raw.className}
                        </p>
                        {opt.raw.department && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {opt.raw.department}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {opt.raw.studentCount || 0}
                      </div>
                    </div>
                  )}
                  renderSelected={(opt) => (
                    <span>
                      {opt.raw.className}
                      <span className="text-slate-400 font-normal">
                        {" "}· {opt.raw.studentCount || 0} students
                      </span>
                    </span>
                  )}
                />
              )}

              {/* selected class preview */}
              <AnimatePresence>
                {selectedClass && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3 bg-blue-50
                                    border border-blue-100 rounded-xl">
                      <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-700 truncate">
                          {selectedClass.className}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedClass.subjects?.map((s) => (
                            <span
                              key={s._id}
                              className="text-[10px] bg-blue-100 text-blue-600
                                         px-1.5 py-0.5 rounded font-medium"
                            >
                              {s.code}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold
                                      text-blue-500 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {selectedClass.studentCount || 0}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* step 2 — subject */}
            <AnimatePresence>
              {selectedClass && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <StepBadge n="2" done={!!selectedSubjectId} />
                    <label className="text-sm font-semibold text-slate-700">
                      Select Subject
                    </label>
                    <span className="text-xs text-slate-400">
                      ({selectedClass.subjects?.length ?? 0} available)
                    </span>
                  </div>

                  {selectedClass.subjects?.length === 0 ? (
                    <div className="flex items-center gap-2 p-3.5 bg-amber-50
                                    border border-amber-100 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-xs font-medium text-amber-700">
                        No subjects assigned to this class yet
                      </p>
                    </div>
                  ) : (
                    <CustomSelect
                      options={subjectOptions}
                      value={selectedSubjectId}
                      placeholder="Choose a subject..."
                      onChange={setSelectedSubjectId}
                      renderOption={(opt) => (
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {opt.raw.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            {opt.raw.code}
                          </p>
                        </div>
                      )}
                      renderSelected={(opt) => (
                        <span>
                          {opt.raw.name}
                          <span className="text-slate-400 font-normal font-mono">
                            {" "}· {opt.raw.code}
                          </span>
                        </span>
                      )}
                    />
                  )}

                  <AnimatePresence>
                    {selectedSubject && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50
                                   border border-emerald-100 rounded-xl"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-emerald-700">
                          {selectedSubject.name} — ready to broadcast
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

                        {/* step 3 — auto end duration */}
            <AnimatePresence>
              {selectedSubject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <StepBadge n="3" done={true} />
                    <label className="text-sm font-semibold text-slate-700">Auto End Session</label>
                  </div>

                  <CustomSelect
                    options={[
                      { value: 5, label: "5 minutes" },
                      { value: 10, label: "10 minutes" },
                      { value: 15, label: "15 minutes (default)" },
                      { value: 20, label: "20 minutes" },
                      { value: 30, label: "30 minutes" },
                      { value: 45, label: "45 minutes" },
                      { value: 60, label: "1 hour" },
                      { value: 90, label: "1 hour 30 minutes" },
                      { value: 120, label: "2 hours" },
                      { value: null, label: "❌ Never auto end" },
                    ]}
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                  />

                  <p className="text-xs text-slate-400 pl-8">
                    Session will automatically end and finalize attendance after this time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* session summary preview */}
            <AnimatePresence>
              {formReady && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="rounded-xl border border-slate-100 bg-gradient-to-br
                             from-slate-50 to-blue-50/40 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Session Preview
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Class",    value: selectedClass?.className   ?? "—" },
                      { label: "Subject",  value: selectedSubject?.name      ?? "—" },
                       { label: "Auto End", value: durationMinutes === null ? "Disabled" : `${durationMinutes} minutes` },
                      { label: "Students", value: `${selectedClass?.studentCount ?? 0} enrolled` },
                      { label: "Mode",     value: "Live QR · Auto-rotate"          },
                    ].map(({ label, value }) => (
                      <div key={label}
                           className="bg-white rounded-lg px-3 py-2.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-semibold
                                      uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-slate-100" />

            {/* launch button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || !formReady}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                         font-bold text-sm transition-all
                         bg-blue-600 hover:bg-blue-700 text-white
                         shadow-sm hover:shadow-md hover:shadow-blue-200
                         disabled:bg-slate-100 disabled:text-slate-400
                         disabled:shadow-none disabled:cursor-not-allowed group"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Starting session...</>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current
                                   group-hover:scale-110 transition-transform" />
                  Launch QR Session
                  {formReady && (
                    <ChevronRight className="w-4 h-4
                                             group-hover:translate-x-0.5 transition-transform" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Footer note ── */}
        <div className="flex items-start gap-3 p-4 bg-amber-50
                        border border-amber-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Note:</strong> Only one active session per faculty is allowed at a time.
            End your existing session before starting another. Session will auto end after {durationMinutes} minutes by default.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartAttendancePage;