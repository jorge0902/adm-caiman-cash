// Tipado + acceso al Read Model de remesas (solo lectura) + acciones admin.
// Fuentes reales (contrato inspeccionado del backend):
//   public.admin_list_remittances(p_remittance_id, p_status, p_limit, p_offset) -> TABLE(...)
//   public.admin_complete_remittance(p_transaction_id)                               -> void
//   public.admin_release_remittance(p_transaction_id, p_reason)                      -> void
//
// ⚠️ CRÍTICO: Complete/Release reciben `p_transaction_id`, NO el id de la remesa.
// El listado expone ambos (id = remesa, transaction_id = transacción); las acciones
// SIEMPRE se cablean con row.transaction_id.
import { supabase } from '../lib/supabase'

export interface Remittance {
  id: string
  transaction_id: string
  user_id: string
  amount: number
  currency_code: string
  exchange_rate: number
  destination_amount: number
  destination_currency: string
  fee_amount: number
  status: string
  created_at: string
  updated_at: string | null
  completed_at: string | null
  recipient_full_name: string | null
  recipient_nickname: string | null
  bank: string | null
  account_type: string | null
  account_last4: string | null
  reference: string | null
  total_amount: number
}

export const REMITTANCE_PAGE_SIZE = 20

/** Lista remesas (paginado). Devuelve el array y si hay una página siguiente. */
export async function fetchAdminRemittances(params: {
  status?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: Remittance[]; hasNext: boolean }> {
  const limit = params.limit ?? REMITTANCE_PAGE_SIZE
  const offset = params.offset ?? 0
  // Consulta 1 fila extra para detectar "hay siguiente" sin un total real del backend.
  const { data, error } = await supabase.rpc('admin_list_remittances', {
    p_status: params.status || null,
    p_limit: limit + 1,
    p_offset: offset,
  })
  if (error) throw error
  const rows = (data ?? []) as Remittance[]
  const hasNext = rows.length > limit
  return { rows: hasNext ? rows.slice(0, limit) : rows, hasNext }
}

/**
 * Completa una remesa (asienta la reserva; el dinero sale del sistema).
 * La RPC recibe SOLO p_transaction_id; la seguridad (admin>=2) está en el backend.
 */
export async function completeRemittance(transactionId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_complete_remittance', {
    p_transaction_id: transactionId,
  })
  if (error) throw error
}

/**
 * Libera una remesa (devuelve los fondos reservados al saldo disponible).
 * p_reason es OPCIONAL en backend; si no hay contenido se envía null.
 */
export async function releaseRemittance(transactionId: string, reason?: string): Promise<void> {
  const trimmed = reason?.trim()
  const { error } = await supabase.rpc('admin_release_remittance', {
    p_transaction_id: transactionId,
    p_reason: trimmed ? trimmed : null,
  })
  if (error) throw error
}

/** Traduce errores de backend a mensajes comprensibles para el usuario. */
export function mapRemittanceActionError(
  err: unknown,
  action: 'complete' | 'release',
): string {
  let code = ''
  let msgFromErr = ''
  if (err && typeof err === 'object') {
    const anyErr = err as { code?: string; message?: string }
    code = anyErr.code ?? ''
    msgFromErr = String(anyErr.message ?? '')
  } else if (typeof err === 'string') {
    code = err
    msgFromErr = err
  }
  const combined = `${code} ${msgFromErr}`.toUpperCase()

  const map: Array<[RegExp, string]> = [
    [/TX_NOT_FOUND/, 'No se encontró la transacción de la remesa.'],
    [/INVALID_STATE/, 'La remesa ya no está en un estado accionable (fue completada, liberada o no es procesable).'],
    [/REMITTANCE_NOT_FOUND/, 'No se encontró la remesa asociada.'],
    [/INSUFFICIENT_ADMIN_LEVEL/, 'Tu nivel de administrador no permite realizar esta acción.'],
    [/NOT_AUTHORIZED/, 'No tienes autorización para realizar esta acción.'],
  ]
  for (const [re, text] of map) if (re.test(combined)) return text

  // No ocultar silenciosamente errores inesperados: mostrar el mensaje real si existe.
  if (msgFromErr) return msgFromErr
  return action === 'complete'
    ? 'No se pudo completar la remesa. Inténtalo de nuevo.'
    : 'No se pudo liberar la remesa. Inténtalo de nuevo.'
}