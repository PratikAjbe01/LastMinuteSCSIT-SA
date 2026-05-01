// src/features/smart-attendance/components/admin/PageHeader.jsx
export const PageHeader = ({ title, description, action, actionLabel, onAction, actionDisabled }) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          disabled={actionDisabled}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
        >
          {action}
          {actionLabel}
        </button>
      )}
    </div>
  )
}