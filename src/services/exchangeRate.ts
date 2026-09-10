// Tipado + acceso del módulo Exchange Rate (tasa activa + historial + cambio).
// Fuentes reales (contrato inspeccionado del backend):
//   public.exchange_rates                -> SELECT público (RLS `true`): tasa activa
//   public.admin_list_audit(...)         -> historial (admin>=2), filtrado por entity_type='exchange_rate'
//   public.change_exchange_rate(...)     -> admin>=3, cambia la tasa (solo RUB->CUP)
import { supabase } from '../lib/supabase'

export interface ActiveRate {
  from_currency: string
  to_currency: string
  rate: number
  source: string
  valid_from: string
}

export const RATE_HISTORY_PAGE_SIZE = 10

/** Filas de audit_logs via admin_list_audit (solo los campos reales del read model). */
export interface RateHistoryEntry {
  id: string
  admin_user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_data: {
    from_currency?: string
    to_currency?: string
    old_rate?: number
    old_valid_from?: string
  } | null
  new_data: {
    from_currency?: string
    to_currency?: string
    rate?: number
    valid_from?: string
    source?: string
  } | null
  reason: string | null
  created_at: string
}

/**
 * Lee la tasa activa RUB->CUP desde `exchange_rates` (SELECT directo, lectura pública por RLS).
 * Decisión aprobada: NO crear un RPC nuevo; leer la fila activa con from_currency='RUB',
 * to_currency='CUP' y valid_until IS NULL. Devuelve null si no hay fila activa.
 */
export async function fetchActiveRate(): Promise<ActiveRate | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('from_currency,to_currency,rate,source,valid_from')
    .eq('from_currency', 'RUB')
    .eq('to_currency', 'CUP')
    .is('valid_until', null)
    .single()
  if (error) throw error
  return (data as ActiveRate) ?? null
}

/**
 * Historial de cambios de tasa via `public.admin_list_audit` filtrado por entity_type='exchange_rate'.
 * Paginacion con `limit+1` para detectar `hasNext` (mismo patron que remittances/deposits).
 */
export async function fetchRateHistory(params: {
  limit?: number
  offset?: number
}): Promise<{ rows: RateHistoryEntry[]; hasNext: boolean }> {
  const limit = params.limit ?? RATE_HISTORY_PAGE_SIZE
  const offset = params.offset ?? 0
  const { data, error } = await supabase.rpc('admin_list_audit', {
    p_entity_type: 'exchange_rate',
    p_limit: limit + 1,
    p_offset: offset,
  })
  if (error) throw error
  const rows = (data ?? []) as RateHistoryEntry[]
  const hasNext = rows.length > limit
  return { rows: hasNext ? rows.slice(0, limit) : rows, hasNext }
}

/**
 * Cambia la tasa RUB->CUP (admin>=3). Delega TODO en public.change_exchange_rate.
 * La autorizacion real (admin>=3) se valida en el backend.
 */
export async function changeExchangeRate(rate: number): Promise<void> {
  const { error } = await supabase.rpc('change_exchange_rate', {
    p_from_currency: 'RUB',
    p_to_currency: 'CUP',
    p_rate: rate,
  })
  if (error) throw error
}

/** Traduce errores de backend a mensajes comprensibles (mismo patron que mapDepositActionError). */
export function mapRateError(err: unknown): string {
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
    [/INVALID_CURRENCY_PAIR/, 'El par de monedas no es válido. Solo se soporta RUB → CUP.'],
    [/INVALID_RATE/, 'La tasa debe ser un número mayor que 0.'],
    [/RATE_OUT_OF_RANGE/, 'La tasa debe ser menor o igual que 1000.'],
    [/RATE_UNCHANGED/, 'La nueva tasa es idéntica a la vigente. No hubo cambios.'],
    [/INSUFFICIENT_ADMIN_LEVEL/, 'Tu nivel de administrador no permite realizar esta acción.'],
    [/NOT_AUTHORIZED/, 'No tienes autorización para realizar esta acción.'],
  ]
  for (const [re, text] of map) if (re.test(combined)) return text

  // No ocultar errores inesperados: mostrar el mensaje real si existe.
  if (msgFromErr) return msgFromErr
  return 'No se pudo realizar el cambio de tasa. Intentalo de nuevo.'
}