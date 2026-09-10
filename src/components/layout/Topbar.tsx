import { useLocation } from 'react-router-dom'
import { NAV_SECTIONS, iconForPath } from './nav'
import { SidebarToggle } from './Sidebar'

function TopbarIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'deposits':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M12 3v13" strokeLinecap="round" /><path d="M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 21h16" strokeLinecap="round" />
        </svg>
      )
    case 'remittances':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M22 2L11 13" strokeLinecap="round" /><path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'users':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" /><path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
        </svg>
      )
    case 'exchange':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" /><path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'recon':
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <path d="M21 12a9 9 0 11-9-9" strokeLinecap="round" /><path d="M21 3v8h-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg {...{ className: className ?? 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true }}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      )
  }
}

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { pathname } = useLocation()

  const flat = NAV_SECTIONS.flatMap((s) => s.items)
  const current = flat.find((i) => pathname === i.to) ?? flat[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-800 bg-admin-bg/90 px-4 backdrop-blur md:px-6">
      <SidebarToggle onClick={onToggleSidebar} />
      <div className="flex min-w-0 items-center gap-2.5">
        <TopbarIcon name={iconForPath(current.to)} className="h-5 w-5 shrink-0 text-accent" />
        <div className="truncate">
          <div className="text-sm font-semibold text-slate-100">{current.title}</div>
          <div className="hidden text-[11px] text-slate-500 sm:block">Caiman Cash · Administración</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2" />
    </header>
  )
}