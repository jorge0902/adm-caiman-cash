import PagePlaceholder from '../components/ui/PagePlaceholder'
import { IconRecon } from '../components/layout/icons'

export default function Reconciliation() {
  return (
    <PagePlaceholder
      eyebrow="Sistema"
      title="Reconciliación"
      description="Reconciliación de carteras y ledgers."
      module="Reconciliación — admin_reconcile"
      requiresLevel={3}
      icon={<IconRecon className="h-7 w-7" />}
    />
  )
}