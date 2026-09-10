// Tipado + acceso del módulo Auditoría (solo lectura).
// Fuente: public.admin_list_audit(p_action, p_entity_type, p_from, p_to, p_limit, p_offset)
//   -> RETURNS TABLE(id, admin_user_id, action, entity_type, entity_id,
//                    old_data jsonb, new_data jsonb, reason, created_at)
// Requiere admin>=2 (valida `private.assert_admin(2)` en el backend).
import { supabase } from '../lib/supabase'

export interface AuditEntry {
  id: string
  admin_user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  reason: string | null
  created_at: string
}

export const AUDIT_PAGE_SIZE = 20

/**
 * Lista registros de auditoría (paginado + filtros server-side).
 * Consulta `limit+1` para detectar "hay siguiente" y devuelve solo `limit` filas.
 * Usa exclusivamente `public.admin_list_audit`; solo lectura, sin escrituras.
 */
export async function fetchAuditLog(params: {
  action?: string | null
  entityType?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: AuditEntry[]; hasNext: boolean }> {
  const limit = params.limit ?? AUDIT_PAGE_SIZE
  const offset = params.offset ?? 0
  const action = params.action?.trim() || null
  const entityType = params.entityType?.trim() || null
  const { data, error } = await supabase.rpc('admin_list_audit', {
    p_action: action,
    p_entity_type: entityType,
    p_limit: limit + 1,
    p_offset: offset,
  })
  if (error) throw error
  const rows = (data ?? []) as AuditEntry[]
  const hasNext = rows.length > limit
  return { rows: hasNext ? rows.slice(0, limit) : rows, hasNext }
}