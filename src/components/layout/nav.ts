export interface NavSection {
  label: string
  items: { label: string; to: string; title: string }[]
}

/** Navegación administrativa. Sin secciones obsoletas (crypto/USDT/marketplace…). */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operaciones',
    items: [
      { label: 'Dashboard', to: '/dashboard', title: 'Operations Overview' },
      { label: 'Depósitos', to: '/deposits', title: 'Depósitos' },
      { label: 'Remesas', to: '/remittances', title: 'Remesas' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Usuarios', to: '/users', title: 'Usuarios' },
      { label: 'Exchange Rate', to: '/exchange-rate', title: 'Exchange Rate' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Auditoría', to: '/audit', title: 'Auditoría' },
      { label: 'Reconciliación', to: '/reconciliation', title: 'Reconciliación' },
    ],
  },
]

/** Todos los paths de rutas protegidas. */
export const ADMIN_PATHS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.to))

/** Ícono por ruta (para el sidebar/topbar). */
export function iconForPath(path: string): string {
  if (path.startsWith('/deposits')) return 'deposits'
  if (path.startsWith('/remittances')) return 'remittances'
  if (path.startsWith('/users')) return 'users'
  if (path.startsWith('/exchange-rate')) return 'exchange'
  if (path.startsWith('/audit')) return 'audit'
  if (path.startsWith('/reconciliation')) return 'recon'
  return 'dashboard'
}