import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya hay sesión, pasar directo al panel (Navigate es la forma declarativa,
  // no dispara setState durante el render).
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  if (session) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error } = await signIn(email.trim(), password)
      if (error) {
        setError(error)
        return
      }
      // onAuthStateChange (SIGNED_IN) actualiza el contexto; el redirect se maneja
      // con <Navigate to={from}> cuando `session` pasa a ser verdadero.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-700/50 bg-admin-panel/80 p-8 shadow-2xl">
          <div className="mb-8 flex flex-col items-center">
            <img src="/logo.png" alt="Caiman Cash" className="h-16 w-16 rounded-2xl" />
            <h1 className="mt-4 text-xl font-bold tracking-widest text-white">CAIMAN CASH</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Admin Operations Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-[#04150e] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}