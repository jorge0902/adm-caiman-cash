import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/LoadingScreen'

/**
 * Protege las rutas administrativas.
 * - Mientras se restaura la sesión: pantalla de carga.
 * - Sin sesión: redirige a /login recordando la ruta de origen.
 * - Con sesión: renderiza el contenido (Outlet).
 */
export function AdminGuard() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return <Outlet />
}