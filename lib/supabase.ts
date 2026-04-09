import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pacamcnphjjggwltvups.supabase.co"
const supabaseAnonKey = "sb_publishable_tPQ3qwwpwJAGv7T8qigDZA_FDcT91VU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)