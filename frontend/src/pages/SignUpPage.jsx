// SignupPage.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Eye, EyeOff, Loader,
  GraduationCap, BookOpen, Hash, Building2, ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { courses, semestersByCourse } from "../utils/Data";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getOrdinalSuffix = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const ROLES = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "faculty", label: "Faculty", icon: BookOpen },
];

const DEPARTMENTS = [
  "Computer Science", "Information Technology",
  "Electronics & Communication", "Electrical Engineering",
  "Mechanical Engineering", "Civil Engineering",
  "Mathematics", "Physics", "Chemistry",
  "Management Studies", "Business Administration",
  "Commerce", "Arts & Humanities", "Other",
];

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-green-400/20 rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ y: [0, -40, 0], opacity: [0, 0.6, 0], scale: [0, 1, 0] }}
        transition={{ duration: Math.random() * 5 + 4, repeat: Infinity, delay: Math.random() * 4 }}
      />
    ))}
  </div>
);

// ── Reusable Input ────────────────────────────────────────────────────────────
const InputField = ({ icon: Icon, error, className = "", ...props }) => (
  <div className="relative group">
    {Icon && (
      <Icon size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500
          group-focus-within:text-green-400 transition-colors z-10 pointer-events-none" />
    )}
    <input
      {...props}
      className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl text-sm text-white
        placeholder-gray-500 bg-gray-800/80 border outline-none transition-all
        ${error
          ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
          : "border-gray-700/60 hover:border-gray-600 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/15"
        } ${className}`}
    />
  </div>
);

// ── Custom Select ─────────────────────────────────────────────────────────────
const SelectField = ({ icon: Icon, value, onChange, options, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      {Icon && (
        <Icon size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none" />
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`w-full text-left pl-10 pr-9 py-3 rounded-xl text-sm border outline-none transition-all
          ${open
            ? "border-green-500/60 ring-2 ring-green-500/15 bg-gray-800"
            : "border-gray-700/60 bg-gray-800/80 hover:border-gray-600"
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          ${selected ? "text-white" : "text-gray-500"}`}
      >
        {selected ? selected.label : placeholder}
        <ChevronDown size={14}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
            transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-gray-700/60
              bg-gray-900/98 backdrop-blur-xl shadow-2xl shadow-black/60 z-50 max-h-48 overflow-y-auto"
          >
            <div className="p-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${value === opt.value
                      ? "bg-green-500/15 text-green-400 font-semibold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-gray-800" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{children}</span>
    <div className="h-px flex-1 bg-gray-800" />
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const SignupPage = () => {
  const { signup, isLoading, error } = useAuthStore();

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    password:    "",
    role:        "student",
    rollNumber:  "",
    department:  "",
    course:      "",
    semester:    "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const courseOptions = courses.map((c) => ({ value: c.value, label: c.label }));

  const semesterOptions = form.course
    ? (semestersByCourse[form.course] || []).map((s) => {
        const n = parseInt(s);
        return {
          value: String(s),
          label: n === 0 ? "All Semesters" : `${s}${getOrdinalSuffix(n)} Semester`,
        };
      })
    : [];

  const deptOptions = DEPARTMENTS.map((d) => ({ value: d, label: d }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signup(
        form.email,
        form.password,
        form.name,
        form.role,
        form.rollNumber,
        form.department,
        form.course,
        form.semester,
      );
      toast.success("Account created successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-24
      bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative overflow-hidden">

      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/80
          shadow-2xl shadow-black/50 overflow-hidden">

          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-gray-800/60">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                flex items-center justify-center shadow-lg shadow-green-500/25">
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400
                  text-transparent bg-clip-text">
                  Create Account
                </h2>
                <p className="text-gray-500 text-sm mt-1">Join the community</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-5 overflow-y-auto">

            {/* Role picker */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Register as
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const Icon  = r.icon;
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set("role", r.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold
                        transition-all duration-200
                        ${active
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-gray-800 bg-gray-800/40 text-gray-500 hover:border-gray-700 hover:text-gray-300"
                        }`}
                    >
                      <Icon size={16} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic info */}
            <SectionLabel>Basic Information</SectionLabel>

            <InputField
              icon={User}
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />

            <InputField
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />

            {/* Password */}
            <div className="relative group">
              <Lock size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500
                  group-focus-within:text-green-400 transition-colors z-10 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-gray-500
                  bg-gray-800/80 border border-gray-700/60 hover:border-gray-600
                  focus:border-green-500/60 focus:ring-2 focus:ring-green-500/15 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Role-specific fields */}
            <AnimatePresence mode="wait">
              {form.role === "student" && (
                <motion.div
                  key="student-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <SectionLabel>Academic Details</SectionLabel>

                  <InputField
                    icon={Hash}
                    type="text"
                    placeholder="Roll number (e.g. 21CS045)"
                    value={form.rollNumber}
                    onChange={(e) => set("rollNumber", e.target.value.toUpperCase())}
                    className="uppercase"
                  />

                  <SelectField
                    icon={BookOpen}
                    value={form.course}
                    onChange={(val) => set("course", val)}
                    options={courseOptions}
                    placeholder="Select course…"
                  />

                  <SelectField
                    icon={GraduationCap}
                    value={form.semester}
                    onChange={(val) => set("semester", val)}
                    options={semesterOptions}
                    placeholder={!form.course ? "Select course first…" : "Select semester…"}
                    disabled={!form.course}
                  />

                  <SelectField
                    icon={Building2}
                    value={form.department}
                    onChange={(val) => set("department", val)}
                    options={deptOptions}
                    placeholder="Select department…"
                  />
                </motion.div>
              )}

              {form.role === "faculty" && (
                <motion.div
                  key="faculty-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SectionLabel>Department</SectionLabel>
                  <div className="mt-3">
                    <SelectField
                      icon={Building2}
                      value={form.department}
                      onChange={(val) => set("department", val)}
                      options={deptOptions}
                      placeholder="Select department…"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20
                  rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-green-500 to-emerald-500
                hover:from-green-400 hover:to-emerald-400
                shadow-lg shadow-green-500/20 hover:shadow-green-500/35
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-300 active:scale-[0.98]
                flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><Loader size={15} className="animate-spin" /> Creating account…</>
                : "Create Account"
              }
            </button>
          </div>

          <div className="px-8 py-4 bg-gray-950/50 border-t border-gray-800/60 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-green-400 font-semibold hover:text-green-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;