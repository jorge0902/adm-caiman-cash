import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminGuard } from './guards/AdminGuard'
import { ToastProvider } from './components/ui/Toast'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Deposits from './pages/Deposits'
import Remittances from './pages/Remittances'
import Users from './pages/Users'
import ExchangeRate from './pages/ExchangeRate'
import Audit from './pages/Audit'
import Reconciliation from './pages/Reconciliation'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Público */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas (requieren sesión) */}
            <Route element={<AdminGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/deposits" element={<Deposits />} />
                <Route path="/remittances" element={<Remittances />} />
                <Route path="/users" element={<Users />} />
                <Route path="/exchange-rate" element={<ExchangeRate />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/reconciliation" element={<Reconciliation />} />
              </Route>
            </Route>

            {/* Fallback: cualquier otra ruta al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}