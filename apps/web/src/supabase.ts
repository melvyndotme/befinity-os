import { createClient } from '@supabase/supabase-js'

const url: unknown = import.meta.env.VITE_SUPABASE_URL
const publishableKey: unknown = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase =
  typeof url === 'string' && typeof publishableKey === 'string' && url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null
