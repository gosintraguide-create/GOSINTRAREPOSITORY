import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export function createClient() {
  return createSupabaseClient(supabaseUrl, publicAnonKey);
}
