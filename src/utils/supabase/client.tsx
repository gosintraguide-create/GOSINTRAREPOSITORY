/**
 * Supabase Client with Realtime Configuration
 * Version: 2024-12-02 - Fixed realtime connection monitoring
 * 
 * This singleton client provides:
 * - Realtime subscriptions for instant updates
 * - Connection status monitoring via subscription callbacks
 * - Automatic error logging
 * 
 * Active Subscriptions:
 * - AdminPage: Bookings, Messages, Pickup Requests
 * - PickupRequestsManagement: Pickup Requests
 * - LiveChat: Chat Messages
 * - DestinationTracker: Check-in Statistics
 * 
 * Each subscription monitors its own status via the subscribe() callback
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      auth: {
        persistSession: false
      }
    });
    
    console.log('✅ Supabase client created with realtime enabled');
  }
  return supabaseClient;
}