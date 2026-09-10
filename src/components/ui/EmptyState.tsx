import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && (
        <div className="mb-1 grid h-14 w-14 place-items-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-500">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      {message && <p className="max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}