// Tipado del RPC public.admin_dashboard() (devuelve jsonb).
// Definición real inspeccionada desde el backend (api.admin_dashboard):
//   total_users, pending_deposits, credited_deposits,
//   pending_remittances, completed_remittances, released_remittances,
//   volume_rub, volume_cup, recent_activity[]
import { supabase } from '../lib/supabase'
export interface ActivityItem {
  type: 'deposit' | 'remittance'
  status: string
  reference: string | null
  amount: number | null
  currency: string | null
  created_at: string
}

export interface AdminDashboard {
  total_users: number
  pending_deposits: number
  credited_deposits: number
  pending_remittances: number
  completed_remittances: number
  released_remittances: number
  volume_rub: number
  volume_cup: number
  recent_activity: ActivityItem[]
}

/** Carga el Dashboard desde admin_dashboard() (solo lectura). */
export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const { data, error } = await supabase.rpc('admin_dashboard')
  if (error) throw error
  return data as AdminDashboard
}