import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mockproject.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'

// Exporta una instancia única del cliente para ser usada en todo el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
