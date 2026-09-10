import PagePlaceholder from '../components/ui/PagePlaceholder'
import { IconAudit } from '../components/layout/icons'

export default function Audit() {
  return (
    <PagePlaceholder
      eyebrow="Sistema"
      title="Auditoría"
      description="Registro de acciones administrativas."
      module="Auditoría — admin_list_audit"
      requiresLevel={2}
      icon={<IconAudit className="h-7 w-7" />}
    />
  )
}