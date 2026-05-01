"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Star,
  CheckCircle,
  Clock,
  Crown,
  User,
  Mail,
  Briefcase,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Filter,
  MoreVertical,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  PlusCircle,
  Link,
  UploadCloud,
  FileText,
  Save,
  Loader,
  BookOpen,
  Shield,
  Hash,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-hot-toast";
import { API_URL } from "../../../../utils/urls";
import { useAuthStore } from "../../../../store/authStore";
import { createPortal } from "react-dom";

const LIMITS = [9, 18, 36];
const CREATOR_EMAILS = ["pratikajbe40@gmail.com", "bdhakad886@gmail.com", "itopsbalram1208@gmail.com"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Testimonials" },
  { value: "Approved", label: "Approved", icon: CheckCircle },
  { value: "Pending", label: "Pending", icon: Clock },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "a-z", label: "Name (A-Z)" },
  { value: "z-a", label: "Name (Z-A)" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const avatarColors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
const getAvatarColor = (id = "") => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600", border: "border-blue-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-600", border: "border-amber-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-600", border: "border-emerald-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-600", border: "border-orange-100" },
    violet: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-600", border: "border-violet-100" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-4 shadow-sm flex items-center gap-3`}>
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <p className={`text-xl font-bold ${c.text} leading-none`}>{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
};

const Badge = ({ show, rating, isUserAdmin }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          show === "yes"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-orange-50 text-orange-600 border-orange-200"
        }`}
      >
        {show === "yes" ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
        {show === "yes" ? "Approved" : "Pending"}
      </span>
      {rating && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            rating === "Outstanding"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          <Star className="w-2.5 h-2.5" /> {rating}
        </span>
      )}
      {isUserAdmin && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-violet-50 text-violet-700 border-violet-200">
          <Shield className="w-2.5 h-2.5" /> Admin
        </span>
      )}
    </div>
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Rows:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LIMITS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
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
          {pages().map((p, i) =>
            p === "..." ? (
              <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white shadow-sm"
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
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

const SlidePanel = ({ isOpen, onClose, title, subtitle, children }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.26, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500 flex-shrink-0">
            <div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              {subtitle && <p className="text-blue-100 text-xs mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
    document.body
  );
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  title,
  message,
  confirmLabel,
  confirmColor = "bg-red-600 hover:bg-red-700",
  icon: Icon = Trash2,
  iconBg = "bg-red-100",
  iconColor = "text-red-600",
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
     <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
        >
          <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h3 className="text-center font-bold text-slate-800 text-base">{title}</h3>
          <p className="text-center text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`flex-1 py-3 ${confirmColor} text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
    document.body
  );
}

const ManageTestimonialsPage = () => {
  const { user } = useAuthStore();
  const isCreator = useMemo(() => user && CREATOR_EMAILS.includes(user.email), [user]);

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    uploaders: 0,
  });

  const [viewPanel, setViewPanel] = useState(false);
  const [uploadPanel, setUploadPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    feedback: "",
    rating: "",
    authorName: "",
    authorEmail: "",
    authorProfession: "",
    isImportant: false,
    profileInputType: "link",
    profileLink: "",
    profileFile: null,
  });

  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
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

  const fetchTestimonials = useCallback(
    async (pg = 1, lim = 9, q = "", status = "all", sort = "newest") => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: pg, limit: lim });
        if (q) params.set("search", q);
        if (status !== "all") params.set("status", status);
        params.set("sort", sort);

        const response = await fetch(`${API_URL}/api/testimonials/getalltestimonialswithuserinfo?${params}`, {
          headers: { Authorization: `Bearer ${user._id}` },
        });
        if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch");
        const result = await response.json();

        let items = Array.isArray(result.testimonials) ? result.testimonials : [];
        
        if (q) {
          items = items.filter(
            (t) =>
              t.message?.toLowerCase().includes(q.toLowerCase()) ||
              t.user?.name?.toLowerCase().includes(q.toLowerCase())
          );
        }
        if (status === "Approved") {
          items = items.filter((t) => t.show === "yes");
        } else if (status === "Pending") {
          items = items.filter((t) => t.show !== "yes");
        }

        items.sort((a, b) => {
          switch (sort) {
            case "oldest":
              return new Date(a.createdAt) - new Date(b.createdAt);
            case "a-z":
              return (a.user?.name || "").localeCompare(b.user?.name || "");
            case "z-a":
              return (b.user?.name || "").localeCompare(a.user?.name || "");
            default:
              return new Date(b.createdAt) - new Date(a.createdAt);
          }
        });

        const totalItems = items.length;
        const totalPgs = Math.ceil(totalItems / lim);
        const startIdx = (pg - 1) * lim;
        const paginatedItems = items.slice(startIdx, startIdx + lim);

        setTestimonials(paginatedItems);
        setTotal(totalItems);
        setTotalPages(totalPgs);

        const uploaderMap = new Map();
        items.forEach((item) => {
          if (item.user?._id) uploaderMap.set(item.user._id, item.user);
        });

        setStats({
          total: items.length,
          approved: items.filter((t) => t.show === "yes").length,
          pending: items.filter((t) => t.show !== "yes").length,
          uploaders: uploaderMap.size,
        });
      } catch (err) {
        toast.error(err.message || "Failed to fetch testimonials");
      } finally {
        setLoading(false);
      }
    },
    [user?._id]
  );

  useEffect(() => {
    if (user?._id) fetchTestimonials(page, limit, search, statusFilter, sortBy);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchTestimonials(1, limit, search, statusFilter, sortBy);
    }, 380);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
    setFilterOpen(false);
    fetchTestimonials(1, limit, search, val, sortBy);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setPage(1);
    fetchTestimonials(1, limit, search, statusFilter, val);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchTestimonials(p, limit, search, statusFilter, sortBy);
  };

  const handleLimitChange = (l) => {
    setLimit(l);
    setPage(1);
    fetchTestimonials(1, l, search, statusFilter, sortBy);
  };

  const refresh = () => fetchTestimonials(page, limit, search, statusFilter, sortBy);

  const guardCreator = () => {
    if (!isCreator) {
      toast.error("Only creators can perform this action");
      return false;
    }
    return true;
  };

  const handleDelete = async () => {
    if (!guardCreator()) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/testimonials/deletetestimonial/${selected._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user._id}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to delete");
      toast.success("Testimonial deleted");
      setDialog(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleApproval = async () => {
    if (!guardCreator()) return;
    setIsSubmitting(true);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/testimonials/togglshowtestimonial`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user._id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selected._id,
          show: selected.show === "yes" ? "no" : "yes",
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to update");
      toast.success("Status updated");
      setDialog(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!guardCreator()) return;
    if (!uploadForm.feedback.trim() || !uploadForm.authorName.trim() || !uploadForm.authorEmail.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting testimonial...");

    try {
      let userProfileUrl = null;

      if (uploadForm.profileInputType === "link" && uploadForm.profileLink) {
        userProfileUrl = uploadForm.profileLink;
      } else if (uploadForm.profileInputType === "upload" && uploadForm.profileFile) {
        toast.loading("Uploading profile image...", { id: toastId });
        const cloudName = "dbf1lifdi";
        const uploadPreset = "frontend_uploads";
        const cloudFormData = new FormData();
        cloudFormData.append("file", uploadForm.profileFile);
        cloudFormData.append("upload_preset", uploadPreset);
        cloudFormData.append("folder", "user_profiles");

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: cloudFormData,
        });

        if (!cloudRes.ok) throw new Error((await cloudRes.json()).error.message);
        const cloudData = await cloudRes.json();
        userProfileUrl = cloudData.secure_url || cloudData.url || "";
      }

      const response = await fetch(`${API_URL}/api/testimonials/uploadtestimonial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: uploadForm.feedback,
          rating: uploadForm.rating,
          userId: user._id,
          username: uploadForm.authorName,
          userEmail: uploadForm.authorEmail,
          course: uploadForm.authorProfession,
          isUserAdmin: uploadForm.isImportant,
          userProfile: userProfileUrl,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).message);

      toast.success("Testimonial submitted successfully!", { id: toastId });
      setUploadPanel(false);
      setUploadForm({
        feedback: "",
        rating: "",
        authorName: "",
        authorEmail: "",
        authorProfession: "",
        isImportant: false,
        profileInputType: "link",
        profileLink: "",
        profileFile: null,
      });
      refresh();
    } catch (error) {
      toast.error(error.message || "Submission failed", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openView = (item) => {
    setSelected(item);
    setViewPanel(true);
    setOpenDropdown(null);
  };

  const openDialog = (type, item) => {
    setSelected(item);
    setDialog(type);
    setActionError("");
    setOpenDropdown(null);
  };

  const dialogConfig = {
    delete: {
      title: "Delete Testimonial",
      message: `Are you sure you want to permanently delete this testimonial? This cannot be undone.`,
      confirmLabel: "Delete",
      confirmColor: "bg-red-600 hover:bg-red-700",
      icon: Trash2,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      onConfirm: handleDelete,
    },
    approve: {
      title: "Approve Testimonial",
      message: `Approve this testimonial? It will be visible on the website.`,
      confirmLabel: "Approve",
      confirmColor: "bg-emerald-600 hover:bg-emerald-700",
      icon: ThumbsUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      onConfirm: handleToggleApproval,
    },
    disapprove: {
      title: "Disapprove Testimonial",
      message: `Disapprove this testimonial? It will be hidden from the website.`,
      confirmLabel: "Disapprove",
      confirmColor: "bg-orange-600 hover:bg-orange-700",
      icon: ThumbsDown,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      onConfirm: handleToggleApproval,
    },
  };

  const activeDlg = dialog ? dialogConfig[dialog] : null;

  const statCards = [
    { label: "Total", value: stats.total, icon: MessageCircle, color: "blue" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "emerald" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "orange" },
    { label: "Uploaders", value: stats.uploaders, icon: User, color: "violet" },
  ];

  const inputCls =
    "w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400";

  if (!isCreator) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin - Manage Testimonials</title>
        <meta name="description" content="Review, approve, and feature student feedback." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Admin · Testimonials
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Manage Testimonials</h1>
            <p className="text-sm text-slate-400 mt-1">Review, approve, and feature student feedback</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUploadPanel(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Add New
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 text-sm font-semibold shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 text-sm">
              All Testimonials
              <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or message..."
                  className="w-full sm:w-64 pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
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

              <div className="relative">
                <button
                  onClick={() => setFilterOpen((p) => !p)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all w-full sm:w-auto justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    {FILTER_OPTIONS.find((f) => f.value === statusFilter)?.label || "All"}
                  </div>
                  <ChevronLeft
                    className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-90" : "-rotate-90"}`}
                  />
                </button>
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      {FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleFilterChange(opt.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                            statusFilter === opt.value
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
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
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["#", "Author", "Email", "Message", "Status", "Date", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Loading testimonials...</p>
                        </td>
                      </tr>
                    ) : testimonials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <MessageCircle className="w-8 h-8 opacity-30" />
                            </div>
                            <p className="text-sm font-semibold">No testimonials found</p>
                            <p className="text-xs opacity-70">Try adjusting your search or filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {testimonials.map((item, idx) => (
                          <motion.tr
                            key={item._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">
                              {(page - 1) * limit + idx + 1}
                            </td>

                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5">
                                {item.userProfile ? (
                                  <img
                                    src={item.userProfile}
                                    alt={item.user?.name}
                                    className="w-9 h-9 rounded-full flex-shrink-0 shadow-sm object-cover"
                                  />
                                ) : (
                                  <div
                                    className={`w-9 h-9 ${getAvatarColor(item._id)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
                                  >
                                    <span className="text-white text-xs font-bold">
                                      {getInitials(item.user?.name)}
                                    </span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">
                                    {item.user?.name || "Anonymous"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5 text-sm text-slate-500 truncate max-w-[180px]">
                              {item.user?.email || "—"}
                            </td>

                            <td className="py-3.5 px-5">
                              <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">"{item.message}"</p>
                            </td>

                            <td className="py-3.5 px-5">
                              <Badge show={item.show} rating={item.rating} isUserAdmin={item.isUserAdmin} />
                            </td>

                            <td className="py-3.5 px-5 text-sm text-slate-400">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>

                            <td className="py-3.5 px-5">
                              <div className="relative" ref={openDropdown === item._id ? dropdownRef : null}>
                                <button
                                  onClick={() => setOpenDropdown(openDropdown === item._id ? null : item._id)}
                                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                  {openDropdown === item._id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden"
                                    >
                                      <button
                                        onClick={() => openView(item)}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                      >
                                        <Eye className="w-4 h-4 text-slate-400" /> View Details
                                      </button>

                                      <div className="border-t border-slate-100 my-1" />

                                      {item.show !== "yes" ? (
                                        <button
                                          onClick={() => openDialog("approve", item)}
                                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        >
                                          <ThumbsUp className="w-4 h-4" /> Approve
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => openDialog("disapprove", item)}
                                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                        >
                                          <ThumbsDown className="w-4 h-4" /> Disapprove
                                        </button>
                                      )}

                                      <div className="border-t border-slate-100 my-1" />

                                      <button
                                        onClick={() => openDialog("delete", item)}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete
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
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </>
          ) : (
            <>
              <div className="p-6">
                {loading ? (
                  <div className="py-20 text-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Loading testimonials...</p>
                  </div>
                ) : testimonials.length === 0 ? (
                  <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 opacity-30" />
                    </div>
                    <p className="text-sm font-semibold">No testimonials found</p>
                    <p className="text-xs opacity-70">Try adjusting your search or filter</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {testimonials.map((item, idx) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {item.userProfile ? (
                                <img
                                  src={item.userProfile}
                                  alt={item.user?.name}
                                  className="w-12 h-12 rounded-full shadow-sm object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-12 h-12 ${getAvatarColor(item._id)} rounded-full flex items-center justify-center shadow-sm`}
                                >
                                  <span className="text-white text-sm font-bold">{getInitials(item.user?.name)}</span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-slate-800 text-sm">{item.user?.name || "Anonymous"}</h3>
                                <p className="text-xs text-slate-400">
                                  {item.createdAt
                                    ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                      })
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="relative" ref={openDropdown === item._id ? dropdownRef : null}>
                              <button
                                onClick={() => setOpenDropdown(openDropdown === item._id ? null : item._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <AnimatePresence>
                                {openDropdown === item._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden"
                                  >
                                    <button
                                      onClick={() => openView(item)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    {item.show !== "yes" ? (
                                      <button
                                        onClick={() => openDialog("approve", item)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50"
                                      >
                                        <ThumbsUp className="w-3.5 h-3.5" /> Approve
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => openDialog("disapprove", item)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50"
                                      >
                                        <ThumbsDown className="w-3.5 h-3.5" /> Disapprove
                                      </button>
                                    )}
                                    <button
                                      onClick={() => openDialog("delete", item)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <Badge show={item.show} rating={item.rating} isUserAdmin={item.isUserAdmin} />
                          <p className="text-sm text-slate-600 mt-3 line-clamp-3">"{item.message}"</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              {!loading && testimonials.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SlidePanel isOpen={viewPanel} onClose={() => setViewPanel(false)} title="Testimonial Details">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 py-4">
              {selected.userProfile ? (
                <img
                  src={selected.userProfile}
                  alt={selected.user?.name}
                  className="w-20 h-20 rounded-2xl shadow-md object-cover"
                />
              ) : (
                <div
                  className={`w-20 h-20 ${getAvatarColor(selected._id)} rounded-2xl flex items-center justify-center shadow-md`}
                >
                  <span className="text-white text-2xl font-bold">{getInitials(selected.user?.name)}</span>
                </div>
              )}
              <div className="text-center">
                <h3 className="font-bold text-slate-800 text-lg">{selected.user?.name || "Anonymous"}</h3>
                <p className="text-slate-400 text-sm">{selected.user?.email || "—"}</p>
              </div>
              <Badge show={selected.show} rating={selected.rating} isUserAdmin={selected.isUserAdmin} />
            </div>

            <div className="space-y-3">
              {[
                { icon: Hash, label: "ID", value: selected._id, mono: true },
                { icon: Mail, label: "Email", value: selected.user?.email || "—" },
                { icon: Briefcase, label: "Profession", value: selected.course || "—" },
                { icon: Star, label: "Rating", value: selected.rating || "Not Rated" },
                {
                  icon: Calendar,
                  label: "Submitted",
                  value: selected.createdAt
                    ? new Date(selected.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })
                    : "—",
                },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p
                      className={`text-sm font-semibold text-slate-700 mt-0.5 break-all ${mono ? "font-mono text-xs" : ""}`}
                    >
                      {value}
                    </p>
                  </div>
                </div>
              ))}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-2">Message</p>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{selected.message}"</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {selected.show !== "yes" ? (
                  <button
                    onClick={() => {
                      setViewPanel(false);
                      openDialog("approve", selected);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Approve
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setViewPanel(false);
                      openDialog("disapprove", selected);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Disapprove
                  </button>
                )}
                <button
                  onClick={() => {
                    setViewPanel(false);
                    openDialog("delete", selected);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>

      <SlidePanel isOpen={uploadPanel} onClose={() => !isSubmitting && setUploadPanel(false)} title="Add Testimonial">
        <form onSubmit={handleUploadSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                className={inputCls}
                value={uploadForm.authorName}
                onChange={(e) => setUploadForm({ ...uploadForm, authorName: e.target.value })}
                placeholder="Author name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="email"
                className={inputCls}
                value={uploadForm.authorEmail}
                onChange={(e) => setUploadForm({ ...uploadForm, authorEmail: e.target.value })}
                placeholder="Email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">Profession</label>
            <input
              className={inputCls}
              value={uploadForm.authorProfession}
              onChange={(e) => setUploadForm({ ...uploadForm, authorProfession: e.target.value })}
              placeholder="e.g., Software Engineer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              className={inputCls}
              value={uploadForm.feedback}
              onChange={(e) => setUploadForm({ ...uploadForm, feedback: e.target.value })}
              placeholder="Share your experience..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Rating</label>
              <div className="flex gap-2">
                {["Good", "Outstanding"].map((r) => (
                  <label
                    key={r}
                    className={`flex-1 cursor-pointer rounded-lg p-2 text-center text-xs font-semibold transition-all border ${
                      uploadForm.rating === r
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={r}
                      checked={uploadForm.rating === r}
                      onChange={(e) => setUploadForm({ ...uploadForm, rating: e.target.value })}
                      className="sr-only"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Admin Label</label>
              <div className="flex gap-2">
                <label
                  className={`flex-1 cursor-pointer rounded-lg p-2 text-center text-xs font-semibold transition-all border ${
                    uploadForm.isImportant
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={uploadForm.isImportant}
                    onChange={() => setUploadForm({ ...uploadForm, isImportant: true })}
                    className="sr-only"
                  />
                  Yes
                </label>
                <label
                  className={`flex-1 cursor-pointer rounded-lg p-2 text-center text-xs font-semibold transition-all border ${
                    !uploadForm.isImportant
                      ? "bg-slate-50 text-slate-600 border-slate-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    checked={!uploadForm.isImportant}
                    onChange={() => setUploadForm({ ...uploadForm, isImportant: false })}
                    className="sr-only"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">Profile Picture (Optional)</label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, profileInputType: "link" })}
                className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  uploadForm.profileInputType === "link"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Link size={14} /> Link
              </button>
              <button
                type="button"
                onClick={() => setUploadForm({ ...uploadForm, profileInputType: "upload" })}
                className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  uploadForm.profileInputType === "upload"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UploadCloud size={14} /> Upload
              </button>
            </div>
            <div className="mt-2">
              {uploadForm.profileInputType === "link" ? (
                <input
                  type="url"
                  value={uploadForm.profileLink}
                  onChange={(e) => setUploadForm({ ...uploadForm, profileLink: e.target.value })}
                  placeholder="https://example.com/profile.jpg"
                  className={inputCls}
                />
              ) : (
                <label className="w-full flex items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                  <FileText size={16} />
                  <span className="truncate text-sm">
                    {uploadForm.profileFile ? uploadForm.profileFile.name : "Choose an image"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, profileFile: e.target.files[0] })}
                    accept="image/*"
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Submit Testimonial
                </>
              )}
            </button>
          </div>
        </form>
      </SlidePanel>

      {activeDlg && (
        <ConfirmDialog
          isOpen={!!dialog}
          onClose={() => {
            setDialog(null);
            setActionError("");
          }}
          onConfirm={activeDlg.onConfirm}
          isSubmitting={isSubmitting}
          title={activeDlg.title}
          message={activeDlg.message}
          confirmLabel={activeDlg.confirmLabel}
          confirmColor={activeDlg.confirmColor}
          icon={activeDlg.icon}
          iconBg={activeDlg.iconBg}
          iconColor={activeDlg.iconColor}
        />
      )}
    </>
  );
};

export default ManageTestimonialsPage;