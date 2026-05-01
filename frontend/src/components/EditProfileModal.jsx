// src/features/smart-attendance/components/EditProfileModal.jsx
import { useState, useMemo, useEffect } from "react";
import {
  User, Mail, ShieldCheck, BookOpen, GraduationCap,
  Save, X, RotateCw, User2Icon, Hash, Building2,
  CheckCircle2, AlertCircle, Loader2, BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../utils/urls";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { courses, semestersByCourse } from "../utils/Data";

const DEPARTMENTS = [
  "Computer Science", "Information Technology",
  "Electronics & Communication", "Electrical Engineering",
  "Mechanical Engineering", "Civil Engineering",
  "Mathematics", "Physics", "Chemistry",
  "Management Studies", "Business Administration",
  "Commerce", "Arts & Humanities", "Other",
];

const ROLL_REGEX = /^[A-Za-z0-9/_-]{2,20}$/;

const getOrdinalSuffix = (n) => {
  if (n === 0) return "";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const buildSemLabel = (val) => {
  const n = parseInt(val);
  return n === 0 ? "All Semesters" : `${val}${getOrdinalSuffix(n)} Semester`;
};

const validateForm = (form) => {
  const errs = {};
  if (!form.name.trim()) {
    errs.name = "Name is required.";
  } else if (form.name.trim().length < 2) {
    errs.name = "At least 2 characters.";
  } else if (form.name.trim().length > 60) {
    errs.name = "Cannot exceed 60 characters.";
  }
  if (form.rollNumber && !ROLL_REGEX.test(form.rollNumber.trim())) {
    errs.rollNumber = "2–20 alphanumeric chars (/, -, _ allowed).";
  }
  if (form.profileUrl && !/^https?:\/\/.+/.test(form.profileUrl.trim())) {
    errs.profileUrl = "Must start with http:// or https://";
  }
  return errs;
};

// ── Custom Select ─────────────────────────────────────────────────────────────
const CustomSelect = ({ options, value, onChange, placeholder, disabled, icon: Icon }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none"
        />
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border text-left transition-all outline-none
          ${open
            ? "border-blue-400 ring-2 ring-blue-100 bg-white"
            : "border-slate-200 bg-white hover:border-blue-300"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          ${value ? "text-slate-800" : "text-slate-400"}`}
      >
        {value ? value.label : placeholder}
        <svg
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                first:rounded-t-xl last:rounded-b-xl
                ${value?.value === opt.value
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
          {options.length === 0 && (
            <p className="px-4 py-3 text-slate-400 text-sm text-center">No options available</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Field Wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, error, hint, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-rose-500 font-medium">
        <AlertCircle size={11} />{error}
      </p>
    )}
    {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const inputBase = `w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border text-slate-800
  placeholder-slate-400 bg-white transition-all outline-none
  border-slate-200 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100`;

const inputErr = "border-rose-400 focus:border-rose-400 focus:ring-rose-100";

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-slate-100" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </span>
    <div className="h-px flex-1 bg-slate-100" />
  </div>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
export const EditProfileModal = ({ onClose, setIsUserEdited }) => {
  const { setUser, user } = useAuthStore();
  const navigate          = useNavigate();

  const [dbUser,       setDbUser]       = useState(null);
  const [isFetching,   setIsFetching]   = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [isReloading,  setIsReloading]  = useState(false);
  const [errors,       setErrors]       = useState({});
  const [touched,      setTouched]      = useState({});

  const [form, setForm] = useState({
    name:       "",
    rollNumber: "",
    department: "",
    course:     "",
    semester:   "",
    profileUrl: "",
  });

  // ── Fetch fresh user from DB ──────────────────────────────────────────────
  const populateForm = (u) => {
    setDbUser(u);
    setForm({
      name:       u.name                              || "",
      rollNumber: u.rollNumber                        || "",
      department: u.department                        || "",
      course:     u.course                            || "",
      semester:   u.semester != null ? String(u.semester) : "",
      profileUrl: u.profileUrl                        || "",
    });
  };

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      setIsFetching(true);
      try {
        const res  = await fetch(`${API_URL}/api/auth/fetchuser/${user._id}`);
        const data = await res.json();
        if (data?.user) populateForm(data.user);
        else toast.error("Could not load profile data.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile data.");
      } finally {
        setIsFetching(false);
      }
    })();
  }, [user?._id]);

  // ── Live validation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const errs     = validateForm(form);
    const filtered = Object.fromEntries(
      Object.entries(errs).filter(([k]) => touched[k])
    );
    setErrors(filtered);
  }, [form, touched]);

  const touch  = (field)      => setTouched((p) => ({ ...p, [field]: true }));
  const setVal = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  // ── Select options ────────────────────────────────────────────────────────
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.value, label: c.label })),
    []
  );

  const semesterOptions = useMemo(() => {
    if (!form.course) return [];
    return (semestersByCourse[form.course] || []).map((s) => ({
      value: String(s),
      label: buildSemLabel(s),
    }));
  }, [form.course]);

  const deptOptions = useMemo(
    () => DEPARTMENTS.map((d) => ({ value: d, label: d })),
    []
  );

  const currentCourse = courseOptions.find((c) => c.value === form.course)     || null;
  const currentSem    = semesterOptions.find((s) => s.value === form.semester)  || null;
  const currentDept   = deptOptions.find((d) => d.value === form.department)    || null;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fix the highlighted errors.");
      return;
    }

    // Build payload — exact field names the controller expects
    const payload = {
      userId:     dbUser._id,
      name:       form.name.trim(),
      rollNumber: form.rollNumber.trim(),
      department: form.department,
      course:     form.course,
      semester:   form.semester,
      profileUrl: form.profileUrl.trim(), // ← camelCase matches controller
    };


    setIsSaving(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/update-user`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setIsUserEdited?.((p) => !p);
        toast.success("Profile updated successfully!");
        onClose();
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reload ────────────────────────────────────────────────────────────────
  const handleReload = async () => {
    setIsReloading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/fetchuser/${user._id}`);
      const data = await res.json();
      if (data?.user) {
        populateForm(data.user);
        setUser(data.user);
        toast.success("Profile refreshed!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh.");
    } finally {
      setIsReloading(false);
    }
  };

  const initials = (dbUser?.name || user?.name || "U")
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden
          bg-white border border-slate-200 shadow-2xl shadow-slate-300/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 px-6 py-5">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30
              flex items-center justify-center shadow-lg overflow-hidden">
              {form.profileUrl ? (
                <img src={form.profileUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-bold text-base leading-none">
                  {dbUser?.name || user?.name || "Your Profile"}
                </h2>
                {dbUser?.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-bold">
                    <BadgeCheck size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-xs mt-1 truncate">{dbUser?.email || user?.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dbUser?.role && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg
                    bg-white/15 border border-white/20 text-white text-[10px] font-semibold capitalize">
                    <ShieldCheck size={9} />{dbUser.role}
                  </span>
                )}
                {dbUser?.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg
                    bg-white/15 border border-white/20 text-white text-[10px] font-semibold">
                    <Building2 size={9} />{dbUser.department}
                  </span>
                )}
                {dbUser?.rollNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg
                    bg-white/15 border border-white/20 text-white text-[10px] font-semibold">
                    <Hash size={9} />{dbUser.rollNumber}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20
                text-white/80 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/50">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <p className="text-sm text-slate-500 font-medium">Loading your profile…</p>
            </div>
          ) : (
            <>
              <SectionLabel>Academic Information</SectionLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Course">
                  <CustomSelect
                    options={courseOptions}
                    value={currentCourse}
                    onChange={(opt) => {
                      setForm((p) => ({ ...p, course: opt?.value || "", semester: "" }));
                      touch("course");
                    }}
                    placeholder="Select course…"
                    icon={BookOpen}
                  />
                </Field>

                <Field label="Semester">
                  <CustomSelect
                    options={semesterOptions}
                    value={currentSem}
                    onChange={(opt) => { setVal("semester", opt?.value || ""); touch("semester"); }}
                    placeholder={!form.course ? "Select course first" : "Select semester…"}
                    disabled={!form.course}
                    icon={GraduationCap}
                  />
                </Field>
              </div>

              <Field label="Department">
                <CustomSelect
                  options={deptOptions}
                  value={currentDept}
                  onChange={(opt) => { setVal("department", opt?.value || ""); touch("department"); }}
                  placeholder="Select department…"
                  icon={Building2}
                />
              </Field>

              <Field
                label="Enrollment Number"
                error={errors.rollNumber}
                hint="e.g. 21CS045 · 2–20 alphanumeric characters"
              >
                <div className="relative">
                  <Hash size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.rollNumber}
                    maxLength={20}
                    onChange={(e) => setVal("rollNumber", e.target.value.toUpperCase())}
                    onBlur={() => touch("rollNumber")}
                    placeholder="e.g. 21CS045"
                    className={`${inputBase} uppercase ${errors.rollNumber ? inputErr : ""}`}
                  />
                  {form.rollNumber && !errors.rollNumber && (
                    <CheckCircle2 size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </Field>

              <SectionLabel>Personal Information</SectionLabel>

              <Field label="Display Name" error={errors.name} required>
                <div className="relative">
                  <User size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.name}
                    maxLength={60}
                    onChange={(e) => setVal("name", e.target.value)}
                    onBlur={() => touch("name")}
                    placeholder="Your full name"
                    className={`${inputBase} ${errors.name ? inputErr : ""}`}
                  />
                  {form.name.trim().length >= 2 && !errors.name && (
                    <CheckCircle2 size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </Field>

              <Field
                label="Avatar URL"
                error={errors.profileUrl}
                hint="Direct image link (https://…)"
              >
                <div className="relative">
                  <User2Icon size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="url"
                    value={form.profileUrl}
                    onChange={(e) => setVal("profileUrl", e.target.value)}
                    onBlur={() => touch("profileUrl")}
                    placeholder="https://example.com/avatar.png"
                    className={`${inputBase} ${errors.profileUrl ? inputErr : ""}`}
                  />
                  {form.profileUrl && !errors.profileUrl && (
                    <CheckCircle2 size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </Field>

              {/* Email — read-only */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white
                border border-slate-200 shadow-sm">
                <Mail size={15} className="text-blue-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email address
                  </p>
                  <p className="text-sm text-slate-700 truncate">{dbUser?.email || user?.email}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100
                  px-2 py-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                  Read-only
                </span>
              </div>

              {/* Verify nudge — strictly only when isVerified is false from DB */}
              {dbUser?.isVerified === false && (
                <button
                  type="button"
                  onClick={() => { navigate("/verify-user-email"); onClose(); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl
                    bg-amber-50 border border-amber-200 text-amber-700
                    hover:bg-amber-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Email not verified</p>
                      <p className="text-xs text-amber-600/80">
                        Click to verify your email address
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline group-hover:no-underline">
                    Verify →
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-200
          flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading || isFetching}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800
              text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isReloading
              ? <Loader2 size={14} className="animate-spin" />
              : <RotateCw size={14} />
            }
            {isReloading ? "Refreshing…" : "Refresh Data"}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200
                bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isFetching}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5
                rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-semibold transition-all
                shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95"
            >
              {isSaving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;