// src/features/smart-attendance/pages/faculty/FacultyDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Users, Play, Calendar, UserPlus,
  Search, Trash2, ChevronRight, LayoutGrid,
  GraduationCap, TrendingUp, Clock, Plus,
  X, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertCircle, RefreshCw,
  Check
} from "lucide-react";
import { useAuthStore } from "../../../../store/authStore";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

// ── Reusable Sub-Components ──────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color = "blue", trend }) => {
  const colors = {
    blue:  { bg: "bg-blue-50",   icon: "text-blue-500",   val: "text-blue-700",  border: "border-blue-100" },
    green: { bg: "bg-green-50",  icon: "text-green-500",  val: "text-green-700", border: "border-green-100" },
    indigo:{ bg: "bg-indigo-50", icon: "text-indigo-500", val: "text-indigo-700",border: "border-indigo-100" },
    slate: { bg: "bg-slate-50",  icon: "text-slate-500",  val: "text-slate-700", border: "border-slate-100" },
  };
  const c = colors[color];
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`${c.bg} p-3 rounded-xl`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
        {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
      </div>
    </div>
  );
};

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
            p === page
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Modal: Enroll Student ────────────────────────────────────────────────────
const EnrollModal = ({ isOpen, onClose, roster, onEnroll, isSubmitting }) => {
  const { fetchInstance } = useFetch();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [enrollingId, setEnrollingId] = useState(null);
  const LIMIT = 6;

  const loadStudents = useCallback(async (q = "", p = 1) => {
    setLoading(true);
    try {
      const res = await fetchInstance.get("/faculty/students", {
        search: q,
        page: p,
        limit: LIMIT,
      });
      setStudents(res?.students || res?.data?.students || []);
      setTotalPages(res?.pagination?.totalPages || res?.totalPages || 1);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [fetchInstance]);

  useEffect(() => {
    if (isOpen) {
      loadStudents("", 1);
      setPage(1);
      setSearch("");
      setEnrollingId(null);
    }
  }, [isOpen, loadStudents]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadStudents(search, 1);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search, loadStudents]);

  const handlePage = (p) => {
    setPage(p);
    loadStudents(search, p);
  };

  const handleEnrollClick = async (studentId) => {
    setEnrollingId(studentId);
    await onEnroll(studentId);
    setEnrollingId(null);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="relative w-full max-w-xl bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-none">Enroll Student</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Search to add students to your roster</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[300px] bg-slate-50/30">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded-md" />
                          <div className="h-3 w-24 bg-slate-200 rounded-md" />
                        </div>
                      </div>
                      <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">No students found</p>
                  <p className="text-xs mt-1 font-medium">Try a different search query</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {students.map((student) => {
                    const isEnrolled = roster.some((r) => r._id === student._id);
                    const isThisSubmitting = isSubmitting && enrollingId === student._id;

                    return (
                      <div
                        key={student._id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isEnrolled 
                            ? "bg-emerald-50/30 border-emerald-100" 
                            : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                            isEnrolled ? "bg-emerald-100 text-emerald-700" : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          }`}>
                            <span className="text-sm font-bold">
                              {student?.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {student.rollNumber || "N/A"}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                • {student.department || "General"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isEnrolled ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            Enrolled
                          </div>
                        ) : (
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleEnrollClick(student._id)}
                            className="flex items-center justify-center min-w-[76px] px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                          >
                            {isThisSubmitting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Enroll"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Footer Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
                <p className="text-xs font-medium text-slate-500">
                  Page <span className="font-bold text-slate-700">{page}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                  >
                    Next <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── Main Dashboard Component ─────────────────────────────────────────────────
const FacultyDashboard = () => {
  const { user } = useAuthStore();
  const { fetchInstance } = useFetch();
  const navigate = useNavigate();

  const [classes, setClasses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [roster, setRoster]             = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Roster pagination (client-side since roster comes as array)
  const ROSTER_PER_PAGE = 8;
  const [rosterPage, setRosterPage] = useState(1);
  const rosterTotalPages = Math.ceil(roster.length / ROSTER_PER_PAGE);
  const paginatedRoster = roster.slice(
    (rosterPage - 1) * ROSTER_PER_PAGE,
    rosterPage * ROSTER_PER_PAGE
  );

  // Classes pagination
  const CLASSES_PER_PAGE = 6;
  const [classPage, setClassPage] = useState(1);
  const classTotalPages = Math.ceil(classes.length / CLASSES_PER_PAGE);
  const paginatedClasses = classes.slice(
    (classPage - 1) * CLASSES_PER_PAGE,
    classPage * CLASSES_PER_PAGE
  );

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      // GET /faculty/my-classes
      const res = await fetchInstance.get("/faculty/my-classes");
      const list = res?.assignedClasses || res?.data?.assignedClasses || [];
      setClasses(list);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls) => {
    if (selectedClass?.classId === cls.classId) return;
    setSelectedClass(cls);
    setRosterPage(1);
    setRosterLoading(true);
    try {
      // GET /faculty/my-classes/:id
      const res = await fetchInstance.get(`/faculty/my-classes/${cls.classId}`);
      const students = res?.class?.students || res?.data?.class?.students || [];
      setRoster(students);
    } catch {
      toast.error("Failed to load class roster");
    } finally {
      setRosterLoading(false);
    }
  };

  const handleEnroll = async (studentId) => {
    setIsSubmitting(true);
    try {
      // POST /faculty/my-classes/:id/students
      await fetchInstance.post(`/faculty/my-classes/${selectedClass.classId}/students`, { studentId });
      toast.success("Student enrolled successfully");
      // Refresh roster
      const res = await fetchInstance.get(`/faculty/my-classes/${selectedClass.classId}`);
      setRoster(res?.class?.students || res?.data?.class?.students || []);
      // Refresh classes list for count update
      const classRes = await fetchInstance.get("/faculty/my-classes");
      setClasses(classRes?.assignedClasses || classRes?.data?.assignedClasses || []);
    } catch (err) {
      toast.error(err.message || "Enrollment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Remove this student from the class?")) return;
    try {
      // DELETE /faculty/my-classes/:classId/students/:studentId
      await fetchInstance.delete(
        `/faculty/my-classes/${selectedClass.classId}/students/${studentId}`
      );
      setRoster((prev) => prev.filter((s) => s._id !== studentId));
      toast.success("Student removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove student");
    }
  };

  const totalStudents = classes.reduce((a, c) => a + (c.studentCount || 0), 0);
  const totalSubjects = classes.reduce((a, c) => a + (c.subjects?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good morning, <span className="text-blue-600">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">{formatDate(new Date())} · Faculty Dashboard</p>
        </div>
        <button
          onClick={() => navigate("/smart/faculty/start-attendance")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          Start Attendance Session
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Classes"    value={classes.length} icon={BookOpen}      color="blue"   trend="Assigned to you" />
        <StatCard label="Total Subjects"    value={totalSubjects}  icon={LayoutGrid}    color="indigo" trend="Across all classes" />
        <StatCard label="Total Students"    value={totalStudents}  icon={GraduationCap} color="green"  trend="Enrolled" />
        <StatCard label="Today's Date"      value={new Date().getDate()} icon={Calendar} color="slate"  trend={new Date().toLocaleString("default", { month: "long", year: "numeric" })} />
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ── Left: Class List ── */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 text-sm">My Classes</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {classes.length} total
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No classes assigned</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50">
                {paginatedClasses.map((cls) => {
                  const isActive = selectedClass?.classId === cls.classId;
                  return (
                    <button
                      key={cls.classId}
                      onClick={() => handleSelectClass(cls)}
                      className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all group ${
                        isActive
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                          {cls.className}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cls.subjects?.slice(0, 3).map((s) => (
                            <span
                              key={s._id}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {s.code}
                            </span>
                          ))}
                          {(cls.subjects?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-400 px-1">+{cls.subjects.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <div className={`text-center px-2.5 py-1 rounded-lg ${isActive ? "bg-blue-100" : "bg-slate-100"}`}>
                          <p className={`text-sm font-bold ${isActive ? "text-blue-700" : "text-slate-600"}`}>
                            {cls.studentCount || 0}
                          </p>
                          <p className="text-[9px] font-medium text-slate-400">students</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-colors ${isActive ? "text-blue-400" : "text-slate-300 group-hover:text-slate-400"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Pagination page={classPage} totalPages={classTotalPages} onPageChange={setClassPage} />
              </div>
            </>
          )}
        </div>

        {/* ── Right: Roster ── */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {selectedClass ? (
              <motion.div
                key={selectedClass.classId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Roster Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">{selectedClass.className}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {roster.length} student{roster.length !== 1 ? "s" : ""} enrolled
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Enroll Student
                  </button>
                </div>

                {/* Roster Table */}
                {rosterLoading ? (
                  <div className="flex items-center justify-center h-56">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : roster.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Users className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No students enrolled yet</p>
                    <p className="text-xs mt-1 opacity-70">Click "Enroll Student" to add students</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No.</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                            <th className="text-right py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {paginatedRoster.map((student, idx) => (
                            <tr key={student._id} className="hover:bg-slate-50/70 transition-colors group">
                              <td className="py-3.5 px-6 text-sm text-slate-400 font-medium">
                                {(rosterPage - 1) * ROSTER_PER_PAGE + idx + 1}
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="text-sm font-mono text-blue-600 font-semibold">
                                  {student.rollNumber || "—"}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 text-[11px] font-bold">
                                      {student.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-700">{student.name}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                  {student.department || "—"}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <button
                                  onClick={() => handleRemoveStudent(student._id)}
                                  className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Remove student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100">
                      <Pagination
                        page={rosterPage}
                        totalPages={rosterTotalPages}
                        onPageChange={(p) => setRosterPage(p)}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full min-h-[460px] bg-white rounded-2xl border-2 border-dashed border-slate-200"
              >
                <LayoutGrid className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-slate-500 font-semibold text-sm">Select a class to view roster</p>
                <p className="text-slate-400 text-xs mt-1">Choose from the list on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Enroll Modal ── */}
      <AnimatePresence>
        {showEnrollModal && (
          <EnrollModal
            isOpen={showEnrollModal}
            onClose={() => setShowEnrollModal(false)}
            roster={roster}
            onEnroll={handleEnroll}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;