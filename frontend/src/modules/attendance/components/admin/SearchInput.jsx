import { Search } from "lucide-react"

// src/features/smart-attendance/components/admin/SearchInput.jsx
export const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl min-w-[240px]">
      <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
      />
    </div>
  )
}