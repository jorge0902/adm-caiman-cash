import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Drawer from '../components/ui/Drawer'
import Modal from '../components/ui/Modal'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import {
  fetchAdminRemittances,
  completeRemittance,
  releaseRemittance,
  mapRemittanceActionError,
  REMITTANCE_PAGE_SIZE,
} from '../services/remittances'
import type { Remittance } from '../services/remittances'

const fmtMoney = (n: number | null | undefined) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-CU', { maximumFractionDigits: 2 }).format(n)
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`

const statusTone = (s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (s === 'completed') return 'success'
  if (s === 'released') return 'info'
  if (s === 'reserved' || s === 'processing') return 'warning'
  if (s === 'failed' || s === 'cancelled') return 'danger'
  return 'neutral'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    reserved: 'Pendiente',
    processing: 'Pendiente',
    completed: 'Completada',
    released: 'Liberada',
    failed: 'Fallida',
    cancelled: 'Cancelada',
  }
  return map[s] ?? s
}

/** Estados accionables: se muestran botones Completar/Liberar. */
const isActionable = (s: string) => s === 'reserved' || s === 'processing'

export default function Remittances() {
  const [rows, setRows] = useState<Remittance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  const [selected, setSelected] = useState<Remittance | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Estado de las acciones completar/liberar
  const [actionTarget, setActionTarget] = useState<Remittance | null>(null)
  const [action, setAction] = useState<'complete' | 'release' | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [releaseReason, setReleaseReason] = useState('')
  const { toast } = useToast()

  const load = useCallback(async (nextStatus: string, nextOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const { rows: r, hasNext: h } = await fetchAdminRemittances({
        status: nextStatus || null,
        limit: REMITTANCE_PAGE_SIZE,
        offset: nextOffset,
      })
      setRows(r)
      setHasNext(h)
    } catch (e) {
      console.error('admin_list_remittances error:', e)
      setError(e instanceof Error ? e.message : 'Error desconocido al listar remesas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const { rows: r, hasNext: h } = await fetchAdminRemittances({
          status: status || null,
          limit: REMITTANCE_PAGE_SIZE,
          offset: page * REMITTANCE_PAGE_SIZE,
        })
        if (!cancelled) {
          setRows(r)
          setHasNext(h)
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error desconocido al listar remesas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  function changeStatus(next: string) {
    setStatus(next)
    setPage(0)
    void load(next, 0)
  }

  function goPage(next: number) {
    setPage(next)
    void load(status, next * REMITTANCE_PAGE_SIZE)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openDetail(r: Remittance) {
    setSelected(r)
    setDetailOpen(true)
  }

  function openComplete(r: Remittance) {
    setActionTarget(r)
    setAction('complete')
    setActionError(null)
  }

  function openRelease(r: Remittance) {
    setActionTarget(r)
    setAction('release')
    setReleaseReason('')
    setActionError(null)
  }

  function closeActionModal() {
    if (actionBusy) return // no cerrar mientras se procesa
    setAction(null)
    setActionTarget(null)
    setActionError(null)
    setReleaseReason('')
  }

  async function confirmAction() {
    if (!actionTarget) return
    setActionBusy(true)
    setActionError(null)
    try {
      if (action === 'complete') {
        await completeRemittance(actionTarget.transaction_id)
        toast('Remesa completada.', 'success')
      } else {
        await releaseRemittance(actionTarget.transaction_id, releaseReason)
        toast('Remesa liberada y fondos devueltos.', 'success')
      }
      const targetTx = actionTarget.transaction_id
      const wasComplete = action === 'complete'
      closeActionModal()
      // Re-cargar listado real
      void load(status, page * REMITTANCE_PAGE_SIZE)
      // Actualizar detalle si está abierto para la misma remesa
      setSelected((prev) =>
        prev && prev.transaction_id === targetTx
          ? { ...prev, status: wasComplete ? 'completed' : 'released' }
          : prev,
      )
    } catch (e) {
      console.error(`${action} error:`, e)
      setActionError(mapRemittanceActionError(e, action ?? 'release'))
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operaciones"
        title="Remesas"
        description="Seguimiento de las remesas RUB → CUP de los clientes."
        actions={
          <Button variant="secondary" size="sm" loading={loading} onClick={() => void load(status, page * REMITTANCE_PAGE_SIZE)}>
            Actualizar
          </Button>
        }
      />

      <Card padding={false}>
        {/* Filtro */}
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-56">
            <Select
              label="Estado"
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'reserved', label: 'Pendientes' },
                { value: 'completed', label: 'Completadas' },
                { value: 'released', label: 'Liberadas' },
              ]}
            />
          </div>
          <div className="ml-auto text-sm text-slate-400">
            {!loading && rows.length > 0 && `${page + 1} · ${rows.length} por página`}
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <LoadingState label="Cargando remesas…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load(status, page * REMITTANCE_PAGE_SIZE)} />
        ) : rows.length === 0 ? (
          <EmptyState title="No hay remesas" message="No se registraron remesas con el filtro seleccionado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Estado', 'Monto', 'Moneda', 'Tasa', 'Destino', 'Comisión', 'Total', 'Destinatario', 'Banco', 'Cuenta', 'Referencia', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5"><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></td>
                    <td className="px-4 py-3.5 text-sm font-medium text-white">{fmtMoney(r.amount)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{r.currency_code}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{fmtMoney(r.exchange_rate)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{fmtMoney(r.destination_amount)} {r.destination_currency}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{fmtMoney(r.fee_amount)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-white">{fmtMoney(r.total_amount)} {r.currency_code}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300" title={r.recipient_full_name ?? undefined}>
                      {r.recipient_full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-300" title={r.bank ?? undefined}>{r.bank ?? '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">
                      {r.account_type ? `${r.account_type} ${r.account_last4 ? `· ${r.account_last4}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400" title={r.reference ?? undefined}>{shortId(r.reference ?? r.id)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {isActionable(r.status) && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => openComplete(r)}>Completar</Button>
                            <Button variant="secondary" size="sm" onClick={() => openRelease(r)}>Liberar</Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openDetail(r)}>Ver detalle</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && !error && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-800 p-4">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => goPage(page - 1)}>
              ← Anterior
            </Button>
            <span className="text-sm text-slate-400">Página {page + 1}</span>
            <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => goPage(page + 1)}>
              Siguiente →
            </Button>
          </div>
        )}
      </Card>

      {/* Modal de confirmación de completar / liberar */}
      <Modal
        open={action !== null && actionTarget !== null}
        onClose={closeActionModal}
        title={action === 'release' ? 'Liberar remesa' : 'Completar remesa'}
        description={undefined}
        footer={
          <>
            <Button variant="secondary" onClick={closeActionModal} disabled={actionBusy}>Cancelar</Button>
            <Button
              variant={action === 'release' ? 'secondary' : 'primary'}
              onClick={() => void confirmAction()}
              loading={actionBusy}
              disabled={actionBusy}
            >
              {action === 'release' ? 'Liberar remesa' : 'Completar remesa'}
            </Button>
          </>
        }
      >
        {actionTarget && (
          <div className="space-y-4">
            {action === 'complete' ? (
              <>
                <p className="text-sm text-slate-300">¿Confirmas que deseas completar esta remesa?</p>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Destinatario</div>
                  <div className="mt-1 text-sm font-semibold text-white">{actionTarget.recipient_full_name ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Monto</div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {fmtMoney(actionTarget.total_amount)} {actionTarget.currency_code}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Destino</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {fmtMoney(actionTarget.destination_amount)} {actionTarget.destination_currency}
                  </div>
                </div>
                {actionTarget.reference && (
                  <div className="rounded-xl border border-slate-800 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Referencia</div>
                    <div className="mt-1 break-all font-mono text-sm text-slate-200">{actionTarget.reference}</div>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Esta operación asienta la reserva y el pago es <span className="font-semibold text-slate-200">definitivo</span>. No podrá deshacerse.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">¿Confirmas que deseas liberar esta remesa?</p>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Destinatario</div>
                  <div className="mt-1 text-sm font-semibold text-white">{actionTarget.recipient_full_name ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Monto</div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {fmtMoney(actionTarget.total_amount)} {actionTarget.currency_code}
                  </div>
                </div>
                {actionTarget.reference && (
                  <div className="rounded-xl border border-slate-800 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Referencia</div>
                    <div className="mt-1 break-all font-mono text-sm text-slate-200">{actionTarget.reference}</div>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Los fondos reservados serán devueltos al saldo disponible. Indica un motivo si lo consideras necesario (opcional).
                </p>
                <textarea
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  disabled={actionBusy}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              </>
            )}
            {actionError && action === 'complete' && <p className="text-xs text-red-400">{actionError}</p>}
          </div>
        )}
      </Modal>

      {/* Detalle */}
      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} title="Detalle de la remesa">
        {selected && (
          <RemittanceDetail
            r={selected}
            onComplete={isActionable(selected.status) ? () => openComplete(selected) : undefined}
            onRelease={isActionable(selected.status) ? () => openRelease(selected) : undefined}
          />
        )}
      </Drawer>
    </div>
  )
}

function RemittanceDetail({
  r,
  onComplete,
  onRelease,
}: {
  r: Remittance
  onComplete?: () => void
  onRelease?: () => void
}) {
  return (
    <div className="space-y-4">
      <InfoRow label="Remesa ID" value={r.id} mono />
      <InfoRow label="Transacción ID" value={r.transaction_id} mono />
      <InfoRow label="Usuario" value={r.user_id} mono />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Monto</div>
          <div className="mt-1 text-lg font-bold text-white">{fmtMoney(r.amount)} {r.currency_code}</div>
        </div>
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Destino</div>
          <div className="mt-1 text-lg font-bold text-white">{fmtMoney(r.destination_amount)} {r.destination_currency}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Tasa de cambio</div>
          <div className="mt-1 text-sm font-semibold text-slate-200">{fmtMoney(r.exchange_rate)}</div>
        </div>
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Comisión</div>
          <div className="mt-1 text-sm font-semibold text-slate-200">{fmtMoney(r.fee_amount)}</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Total</div>
        <div className="mt-1 text-lg font-bold text-white">{fmtMoney(r.total_amount)} {r.currency_code}</div>
      </div>
      <div className="rounded-xl border border-slate-800 p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Estado</div>
        <div className="mt-1"><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></div>
      </div>
      <InfoRow label="Destinatario" value={r.recipient_full_name ?? '—'} />
      {r.recipient_nickname && <InfoRow label="Apodo" value={r.recipient_nickname} />}
      {r.bank && <InfoRow label="Banco" value={r.bank} />}
      {r.account_type && (
        <InfoRow label="Tipo de cuenta" value={`${r.account_type}${r.account_last4 ? ` · ${r.account_last4}` : ''}`} />
      )}
      {r.reference && <InfoRow label="Referencia" value={r.reference} mono />}
      <InfoRow label="Creada" value={fmtDate(r.created_at)} />
      <InfoRow label="Actualizada" value={fmtDate(r.updated_at)} />
      <InfoRow label="Completada / Liberada" value={fmtDate(r.completed_at)} />

      {onComplete && onRelease && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" className="flex-1" onClick={onComplete}>Completar remesa</Button>
          <Button variant="secondary" className="flex-1" onClick={onRelease}>Liberar remesa</Button>
        </div>
      )}
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