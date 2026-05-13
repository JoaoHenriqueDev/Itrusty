import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Supabase: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
