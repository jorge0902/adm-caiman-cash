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
  fetchAdminDeposits,
  fetchDepositSignedUrl,
  approveDeposit,
  rejectDeposit,
  mapDepositActionError,
  DEPOSIT_PAGE_SIZE,
} from '../services/deposits'
import type { Deposit, DepositProof } from '../services/deposits'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-CU', { maximumFractionDigits: 2 }).format(n)

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`

const statusTone = (s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (s === 'credited' || s === 'completed') return 'success'
  if (s === 'rejected' || s === 'cancelled') return 'danger'
  if (s === 'pending') return 'warning'
  if (s === 'processing') return 'info'
  return 'neutral'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = { pending: 'Pendiente', processing: 'En proceso', credited: 'Acreditado', rejected: 'Rechazado', cancelled: 'Cancelado' }
  return map[s] ?? s
}

export default function Deposits() {
  const [rows, setRows] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  const [selected, setSelected] = useState<Deposit | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Estado de las acciones aprobar/rechazar
  const [actionTarget, setActionTarget] = useState<Deposit | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { toast } = useToast()

  const load = useCallback(async (nextStatus: string, nextOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const { rows: r, hasNext: h } = await fetchAdminDeposits({
        status: nextStatus || null,
        limit: DEPOSIT_PAGE_SIZE,
        offset: nextOffset,
      })
      setRows(r)
      setHasNext(h)
    } catch (e) {
      console.error('admin_list_deposits error:', e)
      setError(e instanceof Error ? e.message : 'Error desconocido al listar depósitos')
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
        const { rows: r, hasNext: h } = await fetchAdminDeposits({
          status: status || null,
          limit: DEPOSIT_PAGE_SIZE,
          offset: page * DEPOSIT_PAGE_SIZE,
        })
        if (!cancelled) {
          setRows(r)
          setHasNext(h)
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error desconocido al listar depósitos')
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
    void load(status, next * DEPOSIT_PAGE_SIZE)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openDetail(d: Deposit) {
    setSelected(d)
    setDetailOpen(true)
  }

  function openApprove(d: Deposit) {
    setActionTarget(d)
    setAction('approve')
    setActionError(null)
  }

  function openReject(d: Deposit) {
    setActionTarget(d)
    setAction('reject')
    setRejectReason('')
    setActionError(null)
  }

  function closeActionModal() {
    if (actionBusy) return // no cerrar mientras se procesa
    setAction(null)
    setActionTarget(null)
    setActionError(null)
    setRejectReason('')
  }

  async function confirmAction() {
    if (!actionTarget) return
    if (action === 'reject' && rejectReason.trim().length === 0) {
      setActionError('Debes indicar un motivo para rechazar el depósito.')
      return
    }
    setActionBusy(true)
    setActionError(null)
    try {
      if (action === 'approve') {
        await approveDeposit(actionTarget.id)
        toast('Depósito aprobado y acreditado.', 'success')
      } else {
        await rejectDeposit(actionTarget.id, rejectReason.trim())
        toast('Depósito rechazado.', 'success')
      }
      const targetId = actionTarget.id
      closeActionModal()
      // Re-cargar listado real
      void load(status, page * DEPOSIT_PAGE_SIZE)
      // Actualizar detalle si está abierto para el mismo depósito
      setSelected((prev) => (prev && prev.id === targetId ? { ...prev, status: action === 'approve' ? 'credited' : 'rejected' } : prev))
    } catch (e) {
      console.error(`${action} error:`, e)
      setActionError(mapDepositActionError(e, action ?? 'approve'))
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operaciones"
        title="Depósitos"
        description="Solicitudes de depósito de los clientes. Esta fase es de solo lectura."
        actions={
          <Button variant="secondary" size="sm" loading={loading} onClick={() => void load(status, page * DEPOSIT_PAGE_SIZE)}>
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
                { value: 'pending', label: 'Pendientes' },
                { value: 'credited', label: 'Acreditados' },
                { value: 'rejected', label: 'Rechazados' },
              ]}
            />
          </div>
          <div className="ml-auto text-sm text-slate-400">
            {!loading && rows.length > 0 && `${page + 1} · ${rows.length} por página`}
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <LoadingState label="Cargando depósitos…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load(status, page * DEPOSIT_PAGE_SIZE)} />
        ) : rows.length === 0 ? (
          <EmptyState title="No hay depósitos" message="No se registraron solicitudes de depósito con el filtro seleccionado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['ID', 'Usuario', 'Monto', 'Moneda', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 text-sm text-slate-300" title={d.id}>{shortId(d.id)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300" title={d.user_id}>{shortId(d.user_id)}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-white">{fmtMoney(d.amount)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{d.currency_code}</td>
                    <td className="px-4 py-3.5"><Badge tone={statusTone(d.status)}>{statusLabel(d.status)}</Badge></td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{fmtDate(d.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {d.status === 'pending' && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => openApprove(d)}>Aprobar</Button>
                            <Button variant="danger" size="sm" onClick={() => openReject(d)}>Rechazar</Button>
                          </>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => openDetail(d)}>Ver detalle</Button>
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

      {/* Modal de confirmación de aprobación / rechazo */}
      <Modal
        open={action !== null && actionTarget !== null}
        onClose={closeActionModal}
        title={action === 'reject' ? 'Rechazar depósito' : 'Aprobar depósito'}
        description={undefined}
        footer={
          <>
            <Button variant="secondary" onClick={closeActionModal} disabled={actionBusy}>Cancelar</Button>
            <Button
              variant={action === 'reject' ? 'danger' : 'primary'}
              onClick={() => void confirmAction()}
              loading={actionBusy}
              disabled={actionBusy}
            >
              {action === 'reject' ? 'Rechazar depósito' : 'Aprobar depósito'}
            </Button>
          </>
        }
      >
        {actionTarget && (
          <div className="space-y-4">
            {action === 'approve' ? (
              <>
                <p className="text-sm text-slate-300">¿Confirmas que deseas aprobar este depósito?</p>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Monto</div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {fmtMoney(actionTarget.amount)} {actionTarget.currency_code}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Usuario</div>
                  <div className="mt-1 break-all font-mono text-sm text-slate-200">{actionTarget.user_id}</div>
                </div>
                <p className="text-xs text-slate-400">
                  Esta acción acreditará el importe en el saldo disponible del usuario.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  Indica el motivo del rechazo. El depósito quedará marcado como rechazado.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motivo del rechazo"
                  disabled={actionBusy}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              </>
            )}
            {actionError && action === 'approve' && <p className="text-xs text-red-400">{actionError}</p>}
          </div>
        )}
      </Modal>

      {/* Detalle */}
      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} title="Detalle del depósito">
        {selected && (
          <DepositDetail
            d={selected}
            onApprove={selected.status === 'pending' ? () => openApprove(selected) : undefined}
            onReject={selected.status === 'pending' ? () => openReject(selected) : undefined}
          />
        )}
      </Drawer>
    </div>
  )
}

function DepositDetail({
  d,
  onApprove,
  onReject,
}: {
  d: Deposit
  onApprove?: () => void
  onReject?: () => void
}) {
  const [proof, setProof] = useState<DepositProof | null>(null)
  const [proofLoading, setProofLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!d.proof_url) return
    let cancelled = false
    async function run() {
      setProofLoading(true)
      setProof(null)
      try {
        const res = await fetchDepositSignedUrl(d.id)
        if (!cancelled) setProof(res)
      } catch (e) {
        if (!cancelled)
          setProof({ signedUrl: null, expiresIn: null, error: e instanceof Error ? e.message : 'Error al cargar el comprobante' })
      } finally {
        if (!cancelled) setProofLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [d.id, d.proof_url, reloadKey])

  const showProof = d.proof_url != null && d.proof_url !== ''

  return (
    <div className="space-y-4">
      <InfoRow label="ID" value={d.id} mono />
      <InfoRow label="Usuario" value={d.user_id} mono />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Monto</div>
          <div className="mt-1 text-lg font-bold text-white">{fmtMoney(d.amount)}</div>
        </div>
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Moneda</div>
          <div className="mt-1 text-lg font-bold text-white">{d.currency_code}</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Estado</div>
        <div className="mt-1"><Badge tone={statusTone(d.status)}>{statusLabel(d.status)}</Badge></div>
      </div>
      <InfoRow label="Fecha de creación" value={fmtDate(d.created_at)} />
      <InfoRow label="Fecha de acreditación" value={fmtDate(d.completed_at)} />
      {d.reference && <InfoRow label="Referencia" value={d.reference} mono />}
      {d.payment_method && <InfoRow label="Método de pago" value={d.payment_method} />}

      {/* Comprobante */}
      <div className="rounded-xl border border-slate-800 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Comprobante</div>
          {showProof && proof && proof.signedUrl && (
            <Button variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Renovar enlace</Button>
          )}
        </div>

        {!showProof ? (
          <p className="text-sm text-slate-400">No hay comprobante disponible</p>
        ) : proofLoading ? (
          <LoadingState label="Generando enlace seguro…" />
        ) : proof?.error ? (
          <p className="text-sm text-red-400">No se pudo obtener el comprobante: {proof.error}</p>
        ) : proof?.signedUrl ? (
          <ProofImage url={proof.signedUrl} depositId={d.id} />
        ) : (
          <p className="text-sm text-slate-400">Cargando comprobante…</p>
        )}
      </div>

      {/* Acciones del detalle (solo si el depósito está pendiente) */}
      {onApprove && onReject && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" className="flex-1" onClick={onApprove}>Aprobar depósito</Button>
          <Button variant="danger" className="flex-1" onClick={onReject}>Rechazar depósito</Button>
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

function ProofImage({ url, depositId }: { url: string; depositId: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <p className="text-sm text-slate-400">
        No se pudo mostrar la imagen. Si expiró, usa «Renovar enlace».
      </p>
    )
  }
  return (
    <div className="relative">
      <img
        src={url}
        alt={`Comprobante de depósito ${shortId(depositId)}`}
        className="max-h-72 w-full rounded-lg border border-slate-700 bg-black/40 object-contain"
        onError={() => setFailed(true)}
        loading="lazy"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
      >
        Abrir en nueva pestaña
      </a>
    </div>
  )
}