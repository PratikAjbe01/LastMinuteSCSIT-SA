// src/features/smart-attendance/pages/student/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  QrCode, BookOpen, TrendingUp, Calendar,
  CheckCircle, Clock, AlertCircle, ChevronRight,
  GraduationCap, Activity, BarChart3
} from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";
import { useAuthStore } from "../../../../store/authStore";
import { useIdentityAuth } from "../../hooks/useFingerPrint";

// ── Circular Progress ─────────────────────────────────────────────────────────
const CircularProgress = ({ percentage }) => {
  const radius        = 52;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (percentage / 100) * circumference;
  const isGood        = percentage >= 75;

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={isGood ? "#10b981" : "#ef4444"}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${isGood ? "text-emerald-600" : "text-red-500"}`}>
          {percentage}%
        </span>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Overall</span>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, subtitle, icon: Icon, color, delay }) => {
  const colors = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   val: "text-blue-700",   border: "border-blue-100"   },
    green:  { bg: "bg-emerald-50",icon: "text-emerald-600",val: "text-emerald-700",border: "border-emerald-100" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", val: "text-indigo-700", border: "border-indigo-100"  },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  val: "text-amber-700",  border: "border-amber-100"   },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.val} leading-none`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
};

// ── Subject Breakdown Row ─────────────────────────────────────────────────────
const SubjectRow = ({ subject, idx }) => {
  const pct    = subject.percentage || 0;
  const isGood = pct >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + idx * 0.04 }}
      className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 text-xs font-bold">
          {subject.subject?.charAt(0)?.toUpperCase() || "S"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{subject.subject}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 + idx * 0.04 }}
              className={`h-full rounded-full ${isGood ? "bg-emerald-500" : "bg-red-400"}`}
            />
          </div>
          <span className={`text-xs font-bold flex-shrink-0 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-slate-600">{subject.attended}/{subject.totalClasses}</p>
        <p className="text-[10px] text-slate-400">classes</p>
      </div>

      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isGood ? "bg-emerald-400" : "bg-red-400"}`} />
    </motion.div>
  );
};

// ── Recent Session Row ────────────────────────────────────────────────────────
const RecentRow = ({ session, idx }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 + idx * 0.04 }}
    className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
  >
    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <CheckCircle className="w-4 h-4 text-emerald-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-700 truncate">{session.subjectName}</p>
      <p className="text-xs text-slate-400">{session.className || "—"}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-xs font-medium text-slate-500">{formatDate(session.date)}</p>
      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-semibold">
        Present
      </span>
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user }          = useAuthStore();
  const { fetchInstance } = useFetch();
  const navigate          = useNavigate();
  const { verifyIdentity } = useIdentityAuth();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchInstance.get("/student/dashboard")
      .then((data) => setDashData(data))
      .catch(() => setDashData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleScanClick = async () => {
    const isVerified = await verifyIdentity("Confirm it's you before marking attendance.");
    if (isVerified) {
      navigate("/smart/student/scan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats          = dashData?.stats          || {};
  const subjectList    = dashData?.subjectBreakdown || [];
  const recentSessions = dashData?.recentSessions  || [];

  const percentage = stats.percentage        || 0;
  const attended   = stats.attendedClasses   || 0;
  const total      = stats.totalClasses      || 0;
  const subjects   = stats.enrolledSubjects  || 0;
  const isGood     = percentage >= 75;

  const classesNeeded = isGood
    ? 0
    : Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-5">

      {/* ── Welcome Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Student Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Hello, <span className="text-blue-600">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {formatDate(new Date())} · {user?.rollNumber && `Roll: ${user.rollNumber}`}
          </p>
        </div>

        {/* Scan CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleScanClick}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md hover:shadow-blue-200 transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          Scan QR Code
        </motion.button>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Attendance"
          value={`${percentage}%`}
          subtitle={isGood ? "You're on track" : "Needs attention"}
          icon={TrendingUp}
          color={isGood ? "green" : "amber"}
          delay={0.05}
        />
        <StatCard
          label="Classes Attended"
          value={attended}
          subtitle={`of ${total} total`}
          icon={CheckCircle}
          color="blue"
          delay={0.1}
        />
        <StatCard
          label="Enrolled Subjects"
          value={subjects}
          icon={BookOpen}
          color="indigo"
          delay={0.15}
        />
        <StatCard
          label="Last Attendance"
          value={stats.lastAttendance ? formatDate(stats.lastAttendance) : "No data"}
          icon={Calendar}
          color="amber"
          delay={0.2}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Attendance Overview Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5"
        >
          <div>
            <h2 className="font-bold text-slate-700 text-sm">Attendance Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Current semester progress</p>
          </div>

          {/* Circular + info */}
          <div className="flex items-center gap-5">
            <CircularProgress percentage={percentage} />

            <div className="flex-1 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Status</p>
                <p className={`text-sm font-bold mt-0.5 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
                  {isGood ? "✓ Eligible" : "⚠ At Risk"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {isGood ? "Surplus Classes" : "Classes Needed"}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
                  {isGood
                    ? `+${Math.floor(attended - 0.75 * total)} buffer`
                    : `${classesNeeded} more classes`}
                </p>
              </div>
            </div>
          </div>

          {/* Linear progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Progress to 75%</span>
              <span>{attended}/{total}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((attended / (total || 1)) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`h-full rounded-full ${isGood ? "bg-emerald-500" : "bg-red-400"}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span className="text-amber-500 font-semibold">75% required</span>
              <span>100%</span>
            </div>
          </div>

          {/* Insight pill */}
          <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
            isGood
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-red-50 border-red-100 text-red-600"
          }`}>
            {isGood
              ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span className="leading-relaxed font-medium">
              {isGood
                ? `Great job! You can miss up to ${Math.floor((attended - 0.75 * total) / 0.75)} more classes.`
                : `Attend ${classesNeeded} consecutive classes to reach 75% threshold.`}
            </span>
          </div>
        </motion.div>

        {/* ── Subject Breakdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-700 text-sm">Subject Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">Per-subject attendance rates</p>
            </div>
            <button
              onClick={() => navigate("/smart/student/history")}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 divide-y divide-slate-50">
            {subjectList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No subject data yet</p>
                <p className="text-xs mt-1 opacity-70">Attendance will appear after your first session</p>
              </div>
            ) : (
              subjectList.slice(0, 6).map((sub, idx) => (
                <SubjectRow key={sub.subject} subject={sub} idx={idx} />
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Sessions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-700 text-sm">Recent Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your last 5 attendance records</p>
          </div>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>

        <div className="px-5 divide-y divide-slate-50">
          {recentSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No recent sessions</p>
              <p className="text-xs mt-1 opacity-70">Scan a QR code to mark your first attendance</p>
            </div>
          ) : (
            recentSessions.map((session, idx) => (
              <RecentRow key={session._id} session={session} idx={idx} />
            ))
          )}
        </div>

        {recentSessions.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => navigate("/smart/student/history")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View full history <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;