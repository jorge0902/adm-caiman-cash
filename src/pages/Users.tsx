import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Drawer from '../components/ui/Drawer'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { fetchAdminUsers, USER_PAGE_SIZE } from '../services/users'
import type { AdminUser, UserWallet } from '../services/users'

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const longDate = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Users() {
  const [rows, setRows] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Guarda el último fetch en curso para descartar respuestas obsoletas.
  const seqRef = useRef(0)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce 300 ms; al asentarse, actualiza el término Y resetea a página 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // ÚNICA estrategia de carga: todo el fetch + setState viven AQUÍ (con cancelled),
  // para respetar react-hooks/set-state-in-effect. Se dispara al montar y cuando
  // cambian búsqueda, página o se fuerza reload (Actualizar / retry).
  useEffect(() => {
    const seq = ++seqRef.current
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const { rows: r, hasNext: h } = await fetchAdminUsers({
          search: debounced || null,
          limit: USER_PAGE_SIZE,
          offset: page * USER_PAGE_SIZE,
        })
        if (cancelled || seq !== seqRef.current) return // respuesta obsoleta
        setRows(r)
        setHasNext(h)
      } catch (e) {
        if (cancelled || seq !== seqRef.current) return
        console.error('admin_list_users error:', e)
        setError(e instanceof Error ? e.message : 'Error al listar usuarios')
      } finally {
        if (!cancelled && seq === seqRef.current) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [debounced, page, reloadKey])

  // Disparador único para "Actualizar" y "retry": fuerza el effect (sin duplicar fetch).
  function triggerLoad() {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  function goPage(next: number) {
    setPage(next)
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openDetail(u: AdminUser) {
    setSelected(u)
    setDetailOpen(true)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Gestión"
        title="Usuarios"
        description="Consulta de clientes y sus carteras."
        actions={
          <Button variant="secondary" size="sm" loading={loading} onClick={triggerLoad}>
            Actualizar
          </Button>
        }
      />

      <Card padding={false}>
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <Input
              label="Buscar"
              id="users-search"
              type="search"
              placeholder="Nombre, email o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto text-sm text-slate-400">
            {!loading && rows.length > 0 && `${page + 1} · ${rows.length} por página`}
          </div>
        </div>

        {loading ? (
          <LoadingState label="Cargando usuarios…" />
        ) : error ? (
          <ErrorState message={error} onRetry={triggerLoad} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={debounced ? 'Sin resultados' : 'No hay usuarios'}
            message={debounced ? 'Ningún usuario coincide con la búsqueda.' : 'No hay clientes registrados.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Avatar', 'Nombre', 'Email', 'Teléfono', 'País', 'Creado', 'Carteras', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-800 text-center leading-9 text-xs text-slate-400">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-white">{u.full_name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{u.email || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{u.phone || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-300">{u.country || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3.5"><UserWalletsBadge wallets={u.wallets} /></td>
                    <td className="px-4 py-3.5">
                      <Button variant="secondary" size="sm" onClick={() => openDetail(u)}>Ver detalle</Button>
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

      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null) }} title="Detalle del usuario">
        {selected && <UserDetail u={selected} />}
      </Drawer>
    </div>
  )
}

function UserWalletsBadge({ wallets }: { wallets: UserWallet[] | null }) {
  if (!wallets || wallets.length === 0) return <Badge tone="neutral">Sin carteras</Badge>
  return (
    <div className="flex flex-wrap gap-1">
      {wallets.map((w) => (
        <Badge key={w.currency_code} tone="default">{w.currency_code}</Badge>
      ))}
    </div>
  )
}

function UserDetail({ u }: { u: AdminUser }) {
  return (
    <div className="space-y-4">
      <InfoRow label="ID" value={u.id} mono />
      <InfoRow label="Nombre" value={u.full_name || '—'} />
      <InfoRow label="Email" value={u.email || '—'} />
      <InfoRow label="Teléfono" value={u.phone || '—'} />
      <InfoRow label="País" value={u.country || '—'} />
      <InfoRow label="Fecha de alta" value={longDate(u.created_at)} />

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Carteras</div>
        {u.wallets && u.wallets.length > 0 ? (
          <div className="space-y-2">
            {u.wallets.map((w) => (
              <div key={w.currency_code} className="rounded-xl border border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{w.currency_code}</span>
                  <Badge tone={w.status === 'active' ? 'success' : 'neutral'}>{w.status}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <WalletStat label="Disponible" value={w.available_balance} />
                  <WalletStat label="Reservado" value={w.reserved_balance} />
                  <WalletStat label="Total" value={w.total_balance} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin carteras</p>
        )}
      </div>
    </div>
  )
}

function WalletStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-800/40 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-white">{value.toLocaleString('es-CU', { maximumFractionDigits: 2 })}</div>
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