// src/features/smart-attendance/components/admin/ViewToggle.jsx
export const ViewToggle = ({ view, onChange }) => {
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => onChange('table')}
        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all \({
          view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Table
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all \){
          view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Cards
      </button>
    </div>
  )
}