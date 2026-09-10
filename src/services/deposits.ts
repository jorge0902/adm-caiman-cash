// Tipado + acceso al Read Model de depósitos (solo lectura).
// Fuentes reales (contrato inspeccionado del backend):
//   public.admin_list_deposits(p_status, p_limit, p_offset) -> TABLE(...)
//   public.admin_get_deposit_proof_url(p_deposit_id)         -> text (ruta lógica)
//   Edge Function get-deposit-proof                          -> { expiresIn, signedUrl }
import { supabase } from '../lib/supabase'

export type DepositStatus = string

export interface Deposit {
  id: string
  transaction_id: string | null
  user_id: string
  amount: number
  currency_code: string
  payment_method: string | null
  reference: string | null
  proof_url: string | null
  status: string
  created_at: string
  updated_at: string | null
  completed_at: string | null
}

export const DEPOSIT_PAGE_SIZE = 20

/** Lista depósitos (paginado). Devuelve el array y si hay una página siguiente. */
export async function fetchAdminDeposits(params: {
  status?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: Deposit[]; hasNext: boolean }> {
  const limit = params.limit ?? DEPOSIT_PAGE_SIZE
  const offset = params.offset ?? 0
  // Consulta 1 fila extra para detectar "hay siguiente" sin un total real del backend.
  const { data, error } = await supabase.rpc('admin_list_deposits', {
    p_status: params.status || null,
    p_limit: limit + 1,
    p_offset: offset,
  })
  if (error) throw error
  const rows = (data ?? []) as Deposit[]
  const hasNext = rows.length > limit
  return { rows: hasNext ? rows.slice(0, limit) : rows, hasNext }
}

/** Obtiene el proof_url (ruta lógica) de un depósito. */
export async function fetchDepositProofUrl(depositId: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_get_deposit_proof_url', {
    p_deposit_id: depositId,
  })
  if (error) throw error
  return data as string
}

export interface DepositProof {
  signedUrl: string | null
  expiresIn: number | null
  error: string | null
}

/**
 * Obtiene un signed URL temporal (60s) del comprobante mediante la Edge Function
 * get-deposit-proof. La Edge Function: valida JWT + admin>=2 + deposit_id,
 * lee proof_url del depósito (server-side) y firma la URL.
 * El navegador solo envía deposit_id; nunca un bucket/path arbitrario.
 * La clave de servicio queda exclusivamente en la Edge Function (server-side).
 */
export async function fetchDepositSignedUrl(depositId: string): Promise<DepositProof> {
  const { data, error } = await supabase.functions.invoke('get-deposit-proof', {
    body: { deposit_id: depositId },
  })
  if (error) {
    // FunctionsHttpError: el body con el mensaje está en error.context
    let msg = 'No se pudo obtener el comprobante'
    try {
      if (error.context && typeof error.context.json === 'function') {
        const body = await error.context.json()
        msg = body?.error ?? msg
      }
    } catch {
      /* mantener mensaje genérico */
    }
    return { signedUrl: null, expiresIn: null, error: msg }
  }
  const d = (data ?? {}) as { expiresIn?: number; signedUrl?: string; error?: string }
  if (d.error) return { signedUrl: null, expiresIn: null, error: d.error }
  if (!d.signedUrl) return { signedUrl: null, expiresIn: null, error: 'Respuesta inesperada de la función' }
  return { signedUrl: d.signedUrl, expiresIn: d.expiresIn ?? 60, error: null }
}

/**
 * Aprueba un depósito (acredita el importe en el saldo disponible del usuario).
 * Delega TODO en la RPC public.admin_approve_deposit (backend = única autoridad).
 */
export async function approveDeposit(depositId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_approve_deposit', {
    p_deposit_id: depositId,
  })
  if (error) throw error
}

/**
 * Rechaza un depósito con un motivo obligatorio.
 * Delega TODO en la RPC public.admin_reject_deposit (backend = única autoridad).
 */
export async function rejectDeposit(depositId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_reject_deposit', {
    p_deposit_id: depositId,
    p_reason: reason,
  })
  if (error) throw error
}

/** Traduce errores de backend a mensajes comprensibles para el usuario. */
export function mapDepositActionError(err: unknown, action: 'approve' | 'reject'): string {
  let code = ''
  if (err && typeof err === 'object') {
    const anyErr = err as { code?: string; message?: string }
    code = anyErr.code ?? ''
    // Supabase expone el mensaje en e.message para errores de RPC; también en e.details
  } else if (typeof err === 'string') {
    code = err
  }
  // Comparación robusta: algunos códigos llegan como 'P0001' con el messaje con el nombre en mayúsculas.
  const msgFromErr = err && typeof err === 'object' ? String((err as { message?: string }).message ?? '') : ''
  const combined = `${code} ${msgFromErr}`.toUpperCase()

  const map: Array<[RegExp, string]> = [
    [/ALREADY_CREDITED/, 'Este depósito ya fue acreditado.'],
    [/INVALID_DEPOSIT_STATE/, 'El depósito ya no está pendiente y no puede procesarse.'],
    [/TERMINAL_ALREADY/, 'Este depósito ya fue procesado.'],
    [/DEPOSIT_NOT_FOUND/, 'El depósito no existe o ya no está disponible.'],
    [/INSUFFICIENT_ADMIN_LEVEL/, 'Tu nivel de administrador no permite realizar esta acción.'],
    [/NOT_AUTHORIZED/, 'No tienes autorización para realizar esta acción.'],
  ]
  for (const [re, text] of map) if (re.test(combined)) return text

  if (msgFromErr) return msgFromErr
  return action === 'approve'
    ? 'No se pudo aprobar el depósito. Inténtalo de nuevo.'
    : 'No se pudo rechazar el depósito. Inténtalo de nuevo.'
}