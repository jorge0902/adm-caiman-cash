import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Drawer from '../components/ui/Drawer'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { fetchAuditLog, AUDIT_PAGE_SIZE } from '../services/audit'
import type { AuditEntry } from '../services/audit'

const longDate = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const shortId = (id: string | null | undefined) => {
  if (!id) return '—'
  return id.length > 10 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

// Filtros de entidad (valores reales usados por write_audit en el backend).
const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'deposit', label: 'Depósito (deposit)' },
  { value: 'remittance', label: 'Remesa (remittance)' },
  { value: 'exchange_rate', label: 'Tasa de cambio (exchange_rate)' },
]

// Filtros de acción (valores reales emitidos por audit.write_audit).
const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'DEPOSIT_APPROVED', label: 'Depósito aprobado' },
  { value: 'DEPOSIT_REJECTED', label: 'Depósito rechazado' },
  { value: 'REMITTANCE_COMPLETED', label: 'Remesa completada' },
  { value: 'REMITTANCE_RELEASED', label: 'Remesa liberada' },
  { value: 'RATE_CHANGED', label: 'Tasa cambiada' },
]

const badgeTone = (action: string): 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
  if (action.includes('APPROVED') || action.includes('COMPLETED')) return 'success'
  if (action.includes('REJECTED') || action.includes('FAILED') || action.includes('RELEASED')) return 'danger'
  if (action.includes('CHANGED') || action.includes('UPDATED')) return 'info'
  return 'neutral'
}

export default function Audit() {
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros (valores seleccionados por el usuario).
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  // Filtros "asentados" tras debounce (disparan la carga).
  const [debouncedAction, setDebouncedAction] = useState('')
  const [debouncedEntity, setDebouncedEntity] = useState('')

  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const seqRef = useRef(0)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce 300 ms sobre los dos filtros; al asentarse, actualiza y resetea a página 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedAction(action)
      setDebouncedEntity(entityType)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [action, entityType])

  // Única estrategia de carga (patrón validado): fetch + setState aquí, con cancelled + seqRef.
  useEffect(() => {
    const seq = ++seqRef.current
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const { rows: r, hasNext: h } = await fetchAuditLog({
          action: debouncedAction || null,
          entityType: debouncedEntity || null,
          limit: AUDIT_PAGE_SIZE,
          offset: page * AUDIT_PAGE_SIZE,
        })
        if (cancelled || seq !== seqRef.current) return // respuesta obsoleta
        setRows(r)
        setHasNext(h)
      } catch (e) {
        if (cancelled || seq !== seqRef.current) return
        console.error('admin_list_audit error:', e)
        setError(e instanceof Error ? e.message : 'Error al listar la auditoría')
      } finally {
        if (!cancelled && seq === seqRef.current) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [debouncedAction, debouncedEntity, page, reloadKey])

  function triggerLoad() {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  function goPage(next: number) {
    setPage(next)
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openDetail(e: AuditEntry) {
    setSelected(e)
    setDetailOpen(true)
  }

  const hasFilter = debouncedAction !== '' || debouncedEntity !== ''

  return (
    <div>
      <PageHeader
        eyebrow="Sistema"
        title="Auditoría"
        description="Registro de acciones administrativas."
        actions={
          <Button variant="secondary" size="sm" loading={loading} onClick={triggerLoad}>
            Actualizar
          </Button>
        }
      />

      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="w-full sm:w-56">
            <Select
              label="Acción"
              id="audit-action"
              options={ACTION_OPTIONS}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Entidad"
              id="audit-entity"
              options={ENTITY_OPTIONS}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
          </div>
          <div className="ml-auto pt-1 text-sm text-slate-400">
            {!loading && rows.length > 0 && `${page + 1} · ${rows.length} por página`}
          </div>
        </div>

        {loading ? (
          <LoadingState label="Cargando auditoría…" />
        ) : error ? (
          <ErrorState message={error} onRetry={triggerLoad} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={hasFilter ? 'Sin resultados' : 'No hay registros'}
            message={
              hasFilter
                ? 'Ningún registro coincide con los filtros.'
                : 'Aún no hay actividad administrativa registrada.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Fecha', 'Acción', 'Entidad', 'ID', 'Admin', 'Razón', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 text-sm text-slate-400">{longDate(e.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={badgeTone(e.action)}>{e.action}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{e.entity_type || '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{shortId(e.entity_id)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{shortId(e.admin_user_id)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3.5 text-sm text-slate-300">{e.reason || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Button variant="secondary" size="sm" onClick={() => openDetail(e)}>Ver detalle</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-800 p-4">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => goPage(page - 1)}>← Anterior</Button>
            <span className="text-sm text-slate-400">Página {page + 1}</span>
            <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => goPage(page + 1)}>Siguiente →</Button>
          </div>
        )}
      </Card>

      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null) }} title="Detalle del registro">
        {selected && <AuditDetail entry={selected} />}
      </Drawer>
    </div>
  )
}

function AuditDetail({ entry }: { entry: AuditEntry }) {
  return (
    <div className="space-y-4">
      <InfoRow label="ID" value={entry.id} mono />
      <div className="flex items-center justify-between rounded-xl border border-slate-800 p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Acción</div>
        <Badge tone={badgeTone(entry.action)}>{entry.action}</Badge>
      </div>
      <InfoRow label="Entidad" value={entry.entity_type || '—'} />
      <InfoRow label="ID de entidad" value={entry.entity_id || '—'} mono />
      <InfoRow label="Admin" value={entry.admin_user_id || '—'} mono />
      <InfoRow label="Motivo (reason)" value={entry.reason || '—'} />
      <InfoRow label="Fecha" value={longDate(entry.created_at)} />
      <JsonBlock title="new_data" value={entry.new_data} />
      <JsonBlock title="old_data" value={entry.old_data} />
    </div>
  )
}

function JsonBlock({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <div className="rounded-xl border border-slate-800 p-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{title}</div>
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900/60 p-2 font-mono text-xs text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 break-all text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}