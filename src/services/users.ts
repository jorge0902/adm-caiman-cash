// Tipado + acceso al Read Model de usuarios (solo lectura).
// Fuente: public.admin_list_users(p_search, p_limit, p_offset) -> TABLE(...)
// wallets jsonb = [{currency_code, available_balance, reserved_balance, total_balance, status}]
import { supabase } from '../lib/supabase'

export interface UserWallet {
  currency_code: string
  available_balance: number
  reserved_balance: number
  total_balance: number
  status: string
}

export interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  country: string | null
  avatar_url: string | null
  created_at: string
  wallets: UserWallet[] | null
}

export const USER_PAGE_SIZE = 20

/**
 * Lista usuarios (paginado + búsqueda server-side).
 * Consulta limit+1 para detectar "hay siguiente" y devuelve solo `limit` filas.
 * Usa exclusivamente public.admin_list_users; sin acceso a tablas financieras.
 */
export async function fetchAdminUsers(params: {
  search?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: AdminUser[]; hasNext: boolean }> {
  const limit = params.limit ?? USER_PAGE_SIZE
  const offset = params.offset ?? 0
  const search = params.search?.trim() || null
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: search,
    p_limit: limit + 1,
    p_offset: offset,
  })
  if (error) throw error
  const rows = (data ?? []) as AdminUser[]
  const hasNext = rows.length > limit
  return { rows: hasNext ? rows.slice(0, limit) : rows, hasNext }
}