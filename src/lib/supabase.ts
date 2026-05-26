import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables de entorno faltantes: PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY deben estar configuradas en Netlify (Site settings → Environment variables)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
