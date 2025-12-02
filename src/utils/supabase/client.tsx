/**
 * Supabase Client with Realtime Configuration
 * 
 * This singleton client provides:
 * - Realtime subscriptions for instant updates
 * - Connection status monitoring
 * - Automatic error logging
 * 
 * Active Subscriptions:
 * - AdminPage: Bookings, Messages, Pickup Requests
 * - PickupRequestsManagement: Pickup Requests
 * - LiveChat: Chat Messages
 * - DestinationTracker: Check-in Statistics
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

    // Log connection status changes for debugging
    supabaseClient.realtime.onOpen(() => {
      console.log('🟢 Realtime connection established');
    });

    supabaseClient.realtime.onClose(() => {
      console.log('🔴 Realtime connection closed');
    });

    supabaseClient.realtime.onError((error) => {
      console.error('❌ Realtime connection error:', error);
    });
  }
  return supabaseClient;
}
