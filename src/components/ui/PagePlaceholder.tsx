import { EmptyState } from './EmptyState'
import Badge from './Badge'
import type { ReactNode } from 'react'

interface PagePlaceholderProps {
  eyebrow?: string
  title: string
  description?: string
  /** Módulo que se conectará al backend en una fase posterior. */
  module: string
  /** Requisito de nivel admin estimado (solo informativo, la autorización real vive en PostgreSQL). */
  requiresLevel?: number
  icon?: ReactNode
  primaryAction?: ReactNode
  children?: ReactNode
}

/** Estructura base de una página pendiente de conectar al Read Model de Supabase. */
export default function PagePlaceholder({
  eyebrow,
  title,
  description,
  module,
  requiresLevel,
  icon,
  primaryAction,
  children,
}: PagePlaceholderProps) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</div>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p>}
        </div>
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
      </div>

      {children}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-admin-panel p-6">
        <EmptyState
          icon={icon}
          title="Módulo en preparación"
          message={`La sección «${module}» se conectará al Read Model de Supabase en una fase posterior. Por ahora se muestra el estado vacío del sistema.`}
        />
        <div className="mt-4 flex justify-center gap-2">
          <Badge tone="neutral">{module}</Badge>
          {requiresLevel !== undefined && <Badge tone="info">Requiere nivel admin {requiresLevel}</Badge>}
        </div>
      </div>
    </div>
  )
}