// src/features/smart-attendance/components/AttendanceTable.jsx
import { motion } from "framer-motion";
import { formatTime } from "../utils/helpers";
import { Users, CheckCircle, Clock } from "lucide-react";

const AttendanceTable = ({ records = [], showStatus = false }) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No records found</p>
        <p className="text-xs text-slate-400 mt-1">Attendance entries will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
              <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No.</th>
              <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
              {showStatus && (
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record, idx) => (
              <motion.tr
                key={record._id || idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {/* Index */}
                <td className="py-3.5 px-5 text-sm text-slate-400 font-medium">
                  {String(idx + 1).padStart(2, "0")}
                </td>

                {/* Student name + avatar */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-[11px] font-bold">
                        {(record.name || record.student?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {record.name || record.student?.name || "Unknown"}
                    </span>
                  </div>
                </td>

                {/* Roll number */}
                <td className="py-3.5 px-5">
                  <span className="text-sm font-mono text-blue-600 font-semibold">
                    {record.rollNumber || record.student?.rollNumber || "—"}
                  </span>
                </td>

                {/* Time */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-500 font-medium">
                      {record.time || (record.timestamp ? formatTime(record.timestamp) : "—")}
                    </span>
                  </div>
                </td>

                {/* Status */}
                {showStatus && (
                  <td className="py-3.5 px-5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      {record.status || "Present"}
                    </span>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400 font-medium">
          {records.length} record{records.length !== 1 ? "s" : ""} total
        </p>
      </div>
    </div>
  );
};

export default AttendanceTable;