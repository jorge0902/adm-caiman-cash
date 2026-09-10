import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import {
  fetchActiveRate,
  fetchRateHistory,
  changeExchangeRate,
  mapRateError,
  RATE_HISTORY_PAGE_SIZE,
} from '../services/exchangeRate'
import type { ActiveRate, RateHistoryEntry } from '../services/exchangeRate'

const fmtMoney = (n: number | null | undefined) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-CU', { maximumFractionDigits: 4 }).format(n)
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`

export default function ExchangeRate() {
  const [activeRate, setActiveRate] = useState<ActiveRate | null>(null)
  const [rateLoading, setRateLoading] = useState(true)
  const [rateError, setRateError] = useState<string | null>(null)

  const [historyRows, setHistoryRows] = useState<RateHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  // Modal de cambio
  const [changeOpen, setChangeOpen] = useState(false)
  const [changeStep, setChangeStep] = useState<'input' | 'confirm'>('input')
  const [newRate, setNewRate] = useState('')
  const [newRateError, setNewRateError] = useState<string | null>(null)
  const [changeBusy, setChangeBusy] = useState(false)
  const [changeActionError, setChangeActionError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadAll = useCallback(async () => {
    setRateLoading(true)
    setRateError(null)
    try {
      const r = await fetchActiveRate()
      setActiveRate(r)
    } catch (e) {
      console.error('exchange_rates error:', e)
      setRateError(e instanceof Error ? e.message : 'Error al cargar la tasa de cambio')
    } finally {
      setRateLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (nextPage: number) => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const { rows, hasNext: h } = await fetchRateHistory({
        limit: RATE_HISTORY_PAGE_SIZE,
        offset: nextPage * RATE_HISTORY_PAGE_SIZE,
      })
      setHistoryRows(rows)
      setHasNext(h)
    } catch (e) {
      console.error('admin_list_audit error:', e)
      setHistoryError(e instanceof Error ? e.message : 'Error al cargar el historial de tasas')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setRateLoading(true)
      setHistoryLoading(true)
      try {
        const r = await fetchActiveRate()
        if (!cancelled) setActiveRate(r)
      } catch (e) {
        if (!cancelled) setRateError(e instanceof Error ? e.message : 'Error al cargar la tasa de cambio')
      } finally {
        if (!cancelled) setRateLoading(false)
      }
      try {
        const { rows, hasNext: h } = await fetchRateHistory({
          limit: RATE_HISTORY_PAGE_SIZE,
          offset: 0,
        })
        if (!cancelled) {
          setHistoryRows(rows)
          setHasNext(h)
        }
      } catch (e) {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : 'Error al cargar el historial de tasas')
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  function goPage(next: number) {
    setPage(next)
    void loadHistory(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openChange() {
    setNewRate('')
    setNewRateError(null)
    setChangeActionError(null)
    setChangeStep('input')
    setChangeOpen(true)
  }

  function closeChange() {
    if (changeBusy) return
    setChangeOpen(false)
  }

  function validateRate(v: string): string | null {
    const n = Number(v)
    if (!v.trim() || !Number.isFinite(n) || n <= 0) return 'La tasa debe ser un número mayor que 0.'
    if (n > 1000) return 'La tasa debe ser menor o igual que 1000.'
    return null
  }

  function continueToConfirm() {
    const err = validateRate(newRate)
    if (err) { setNewRateError(err); return }
    setNewRateError(null)
    setChangeStep('confirm')
  }

  async function confirmChange() {
    if (changeBusy) return
    const n = Number(newRate)
    setChangeBusy(true)
    setChangeActionError(null)
    try {
      await changeExchangeRate(n)
      toast('Tasa de cambio actualizada.', 'success')
      closeChange()
      void loadAll()
      void loadHistory(0)
      setPage(0)
    } catch (e) {
      setChangeActionError(mapRateError(e))
    } finally {
      setChangeBusy(false)
    }
  }

  const nextRate = changeStep === 'confirm' ? Number(newRate) : null

  return (
    <div>
      <PageHeader
        eyebrow="Gestión"
        title="Exchange Rate"
        description="Gestión de la tasa de cambio RUB → CUP."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={rateLoading || historyLoading}
              onClick={() => { void loadAll(); void loadHistory(page) }}
            >
              Actualizar
            </Button>
            <Button variant="primary" size="sm" onClick={openChange}>
              Cambiar tasa
            </Button>
          </div>
        }
      />

      {/* Tasa actual */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tipo de cambio vigente</div>
          {rateLoading ? (
            <LoadingState label="Cargando tasa…" />
          ) : rateError ? (
            <ErrorState message={rateError} onRetry={() => void loadAll()} />
          ) : activeRate ? (
            <div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">1 {activeRate.from_currency}</span>
                <span className="text-xl text-slate-400">=</span>
                <span className="text-2xl font-bold text-accent">{fmtMoney(activeRate.rate)} {activeRate.to_currency}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="info">{activeRate.source}</Badge>
                <span className="text-xs text-slate-500">Vigente desde {fmtDate(activeRate.valid_from)}</span>
              </div>
            </div>
          ) : (
            <EmptyState title="Sin tasa activa" message="No hay una tasa RUB → CUP vigente." />
          )}
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Par soportado</div>
          <div className="mt-3"><Badge tone="default">RUB → CUP</Badge></div>
          <p className="mt-3 text-xs text-slate-500">
            Solo se admite RUB → CUP. Los cambios requieren admin nivel 3; la autorización real se valida del lado del backend.

          </p>
        </Card>
      </div>

      {/* Historial */}
      <Card padding={false}>
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="text-sm font-semibold text-slate-200">Historial de cambios</div>
          {!historyLoading && historyRows.length > 0 && (
            <div className="text-sm text-slate-400">{page + 1} · {historyRows.length} por página</div>
          )}
        </div>
        {historyLoading ? (
          <LoadingState label="Cargando historial…" />
        ) : historyError ? (
          <ErrorState message={historyError} onRetry={() => void loadHistory(page)} />
        ) : historyRows.length === 0 ? (
          <EmptyState title="Sin historial" message="No hay cambios de tasa registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Fecha', 'Anterior', 'Nueva', 'Administrador'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((h) => (
                  <tr key={h.id} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 text-sm text-slate-300">{fmtDate(h.created_at)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{h.old_data?.old_rate != null ? fmtMoney(h.old_data.old_rate) : '—'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-white">{h.new_data?.rate != null ? fmtMoney(h.new_data.rate) : '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400" title={h.admin_user_id ?? undefined}>
                      {h.admin_user_id ? shortId(h.admin_user_id) : 'sistema'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!historyLoading && !historyError && historyRows.length > 0 && (
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

      {/* Modal de cambio de tasa (2 pasos: introducir → confirmar) */}
      <Modal
        open={changeOpen}
        onClose={closeChange}
        title="Cambiar tasa de cambio"
        description="RUB → CUP"
        footer={
          changeStep === 'input' ? (
            <>
              <Button variant="secondary" onClick={closeChange} disabled={changeBusy}>Cancelar</Button>
              <Button variant="primary" onClick={continueToConfirm}>Continuar</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={closeChange} disabled={changeBusy}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={() => void confirmChange()}
                loading={changeBusy}
                disabled={changeBusy}
              >
                Confirmar cambio
              </Button>
            </>
          )
        }
      >
        {changeStep === 'input' ? (
          <div className="space-y-4">
            <Input
              id="rate"
              label="Nueva tasa (RUB → CUP)"
              type="number"
              inputMode="decimal"
              step="any"
              min="0.000001"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="Ej.: 10.50"
              error={newRateError ?? undefined}
              autoFocus
            />
            <p className="text-xs text-slate-500">
              Valor permitido: mayor que 0 y menor o igual que 1000. El backend valida nuevamente la autoridad final.

            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Confirma el cambio de tasa:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Actual</div>
                <div className="mt-1 text-lg font-bold text-white">{fmtMoney(activeRate?.rate)}</div>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Nueva</div>
                <div className="mt-1 text-lg font-bold text-accent">{fmtMoney(nextRate)}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              El cambio asienta la tasa y cierra la anterior. Las remesas existentes conservan su tasa histórica (snapshot).
            </p>
            {changeActionError && <p className="text-xs text-red-400">{changeActionError}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}