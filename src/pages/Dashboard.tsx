import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { fetchAdminDashboard } from '../services/dashboard'
import type { AdminDashboard, ActivityItem } from '../services/dashboard'

const fmtInt = (n: number) => new Intl.NumberFormat('es-CU', { maximumFractionDigits: 0 }).format(n)

const fmtRUB = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)

const fmtCUP = (n: number) =>
  new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', maximumFractionDigits: 0 }).format(n)

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Kpi {
  label: string
  value: string
  tone: 'default' | 'neutral'
}

export default function Dashboard() {
  const { toast } = useToast()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchAdminDashboard())
    } catch (e) {
      console.error('admin_dashboard error:', e)
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError(msg)
      toast('No se pudo cargar el Dashboard.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchAdminDashboard()
        if (!cancelled) setData(result)
      } catch (e) {
        console.error('admin_dashboard error:', e)
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        if (!cancelled) {
          setError(msg)
          toast('No se pudo cargar el Dashboard.', 'error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [toast])

  if (loading) {
    return (
      <div>
        <PageHeader
          eyebrow="Financial operations"
          title="Operations Overview"
          description="Panel principal de administración de Caiman Cash."
          actions={<Button variant="secondary" size="sm" disabled>Refrescar</Button>}
        />
        <Card><LoadingState label="Cargando indicadores del sistema…" /></Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader
          eyebrow="Financial operations"
          title="Operations Overview"
          description="Panel principal de administración de Caiman Cash."
        />
        <Card>
          <ErrorState
            message={`No se pudo conectar con el servicio de datos: ${error ?? 'respuesta vacía'}`}
            onRetry={() => void load()}
          />
        </Card>
      </div>
    )
  }

  const kpis: Kpi[] = [
    { label: 'Usuarios totales', value: fmtInt(data.total_users), tone: 'default' },
    { label: 'Depósitos pendientes', value: fmtInt(data.pending_deposits), tone: 'neutral' },
    { label: 'Depósitos acreditados', value: fmtInt(data.credited_deposits), tone: 'neutral' },
    { label: 'Remesas pendientes', value: fmtInt(data.pending_remittances), tone: 'neutral' },
    { label: 'Remesas completadas', value: fmtInt(data.completed_remittances), tone: 'neutral' },
    { label: 'Remesas liberadas', value: fmtInt(data.released_remittances), tone: 'neutral' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Financial operations"
        title="Operations Overview"
        description="Panel principal de administración de Caiman Cash."
        actions={
          <Button variant="secondary" size="sm" loading={loading} onClick={() => void load()}>
            Actualizar
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{k.label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-white">{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Volúmenes */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Volumen enviado (RUB)</div>
              <div className="mt-1 text-xs text-slate-400">Remesas en rublos</div>
            </div>
            <Badge>RUB</Badge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white">{fmtRUB(data.volume_rub)}</div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Volumen entregado (CUP)</div>
              <div className="mt-1 text-xs text-slate-400">Entregas en pesos cubanos</div>
            </div>
            <Badge tone="info">CUP</Badge>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white">{fmtCUP(data.volume_cup)}</div>
        </Card>
      </div>

      {/* Actividad reciente */}
      <div className="mt-4">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Actividad reciente</h3>
              <p className="mt-0.5 text-xs text-slate-500">Últimas operaciones registradas</p>
            </div>
            {data.recent_activity.length > 0 && <Badge>{data.recent_activity.length}</Badge>}
          </div>

          {data.recent_activity.length === 0 ? (
            <EmptyState title="No hay actividad reciente" message="Aún no se registran operaciones en el sistema." />
          ) : (
            <div className="divide-y divide-slate-800/60">
              {data.recent_activity.map((a: ActivityItem, i: number) => (
                <div key={`${a.created_at}-${i}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge tone={a.type === 'deposit' ? 'info' : 'default'}>
                      {a.type === 'deposit' ? 'Depósito' : 'Remesa'}
                    </Badge>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-200">
                        {a.currency ? fmtNumber(a.amount, a.currency) : '—'}
                      </div>
                      <div className="truncate text-xs text-slate-500">{a.reference ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                    <span className="text-xs text-slate-400">{fmtDate(a.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function fmtNumber(amount: number | null, currency: string) {
  if (amount === null) return '—'
  if (currency === 'RUB') return fmtRUB(amount)
  if (currency === 'CUP') return fmtCUP(amount)
  return fmtInt(amount)
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    credited: 'Acreditado',
    reserved: 'Reservada',
    completed: 'Completada',
    released: 'Liberada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
  }
  return map[status] ?? status
}

function statusTone(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (['completed', 'credited', 'released'].includes(status)) return 'success'
  if (status === 'rejected') return 'danger'
  if (['pending', 'reserved'].includes(status)) return 'warning'
  if (status === 'processing') return 'info'
  return 'neutral'
}