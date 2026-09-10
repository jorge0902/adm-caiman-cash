import type { ReactNode } from 'react'
import clsx from 'clsx'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'

export interface Column<T> {
  key: string
  header: string
  /** Accede al valor del campo; si no se usa `render`, se muestra `String(access(row))`. */
  access?: (row: T) => ReactNode
  render?: (row: T) => ReactNode
  align?: 'left' | 'right'
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyMessage?: string
  /** Etiquetas cortas para el modo móvil (cards). Por defecto usa `header`. */
  mobileLabels?: string[]
}

export default function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle = 'Sin registros',
  emptyMessage = 'No hay datos para mostrar en esta sección.',
  mobileLabels,
}: TableProps<T>) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />

  return (
    <div className="w-full overflow-hidden">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={clsx(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500',
                    c.align === 'right' && 'text-right',
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx('px-4 py-3.5 text-sm text-slate-300', c.align === 'right' && 'text-right')}
                  >
                    {c.render ? c.render(row) : c.access ? c.access(row) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-xl border border-slate-800 bg-admin-panel p-4">
            {columns.map((c, i) => (
              <div key={c.key} className="flex items-center justify-between border-b border-slate-800/60 py-2 text-sm last:border-0">
                <span className="text-xs text-slate-500">{mobileLabels?.[i] ?? c.header}</span>
                <span className="text-slate-200">{c.render ? c.render(row) : c.access ? c.access(row) : '-'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}