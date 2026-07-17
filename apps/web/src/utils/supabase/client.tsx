/**
 * Supabase Client with Realtime Configuration
 * Version: 2024-12-02 - Optimized for realtime-first architecture
 * 
 * This singleton client provides:
 * - Realtime subscriptions for instant updates (NOW ENABLED on kv_store_3bd0ade8)
 * - Polling fallback as a safety net for edge cases
 * - Connection status monitoring via subscription callbacks
 * - Automatic error logging
 * 
 * Realtime is now the primary update mechanism with polling as a lightweight fallback:
 * - Bookings: Realtime primary, polling every 3 minutes as safety net
 * - Messages: Realtime primary, polling every 3 minutes as safety net
 * - Pickup Requests: Realtime primary, polling every 2 minutes as safety net
 * - Destination Tracker: Realtime primary, polling every 3 minutes as safety net
 * - Live Chat: Realtime primary, polling every 2 minutes as safety net
 * 
 * Active Subscriptions:
 * - AdminPage: Bookings, Messages, Pickup Requests
 * - PickupRequestsManagement: Pickup Requests
 * - LiveChat: Chat Messages
 * - DestinationTracker: Check-in Statistics
 * - OperationsPage: Pickup Requests
 * 
 * Each subscription monitors its own status via the subscribe() callback.
 * When SUBSCRIBED status is received, realtime is working correctly.
 * When CHANNEL_ERROR or TIMED_OUT is received, polling fallback takes over.
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
