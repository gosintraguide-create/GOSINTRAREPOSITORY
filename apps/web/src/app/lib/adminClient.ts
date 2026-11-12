import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export const adminClient = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  auth: {
    storageKey: 'hopon-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
