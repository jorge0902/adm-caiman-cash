import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { NAV_SECTIONS, iconForPath } from './nav'
import {
  IconDashboard,
  IconDeposits,
  IconRemittances,
  IconUsers,
  IconExchange,
  IconAudit,
  IconRecon,
  IconMenu,
  IconLogout,
} from './icons'

function SidebarIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'deposits':
      return <IconDeposits className={className} />
    case 'remittances':
      return <IconRemittances className={className} />
    case 'users':
      return <IconUsers className={className} />
    case 'exchange':
      return <IconExchange className={className} />
    case 'audit':
      return <IconAudit className={className} />
    case 'recon':
      return <IconRecon className={className} />
    default:
      return <IconDashboard className={className} />
  }
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
    onClose()
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'AD'

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[#040a14]/60 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-gradient-to-b from-[#0a101c] to-[#101a2b] text-white transition-transform md:translate-x-0 md:static ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Caiman Cash" className="h-9 w-9 rounded-lg" />
            <div>
              <div className="text-sm font-bold tracking-[0.12em]">CAIMAN CASH</div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Operations Center</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">
                {section.label}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-accent/15 font-semibold text-accent'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <SidebarIcon name={iconForPath(item.to)} className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pie */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#111a2b] text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-200">{user?.email ?? 'Administrador'}</div>
              <div className="text-[10px] text-slate-500">Administrator</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Operativo
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <IconLogout className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// Botón hamburguesa usado por el Topbar
export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 transition hover:border-slate-600 hover:text-white md:hidden"
      aria-label="Abrir menú"
    >
      <IconMenu className="h-5 w-5" />
    </button>
  )
}