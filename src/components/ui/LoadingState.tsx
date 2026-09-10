import { Spinner } from './Spinner'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Cargando…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Spinner className="h-7 w-7 text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}