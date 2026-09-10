import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env (ver .env.example).'
  )
}

// Solo credenciales públicas (anon). La clave de servicio se usa únicamente server-side
// (Edge Functions); no debe existir en el frontend.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)