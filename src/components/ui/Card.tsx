import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  /** sin padding interno */
  padding?: boolean
}

export default function Card({ children, padding = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-800 bg-admin-panel shadow-sm',
        padding && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Cabecera de tarjeta con título y acción opcional. */
export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}