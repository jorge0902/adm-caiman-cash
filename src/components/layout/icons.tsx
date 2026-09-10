/** Iconos minimalistas en línea (stroke). Sin dependencias externas. */
interface IconProps {
  className?: string
}

const svgProps = (className?: string) => ({
  className: className ?? 'h-5 w-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
})

export function IconDashboard({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function IconDeposits({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 3v13" />
      <path d="M8 12l4 4 4-4" />
      <path d="M4 21h16" />
    </svg>
  )
}

export function IconRemittances({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

export function IconExchange({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

export function IconAudit({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function IconRecon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M21 12a9 9 0 11-9-9" />
      <path d="M21 3v8h-8" />
    </svg>
  )
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export function IconEmpty({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M3 3h18v18H3z" />
      <path d="M8 16l4-4 3 3 5-5" />
    </svg>
  )
}