import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Replace with your Supabase URL and anon key
// You'll need to create a Supabase project and get these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);