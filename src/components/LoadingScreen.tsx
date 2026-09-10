export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Caiman Cash" className="h-14 w-14 rounded-2xl" />
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Cargando panel…
        </div>
      </div>
    </div>
  )
}