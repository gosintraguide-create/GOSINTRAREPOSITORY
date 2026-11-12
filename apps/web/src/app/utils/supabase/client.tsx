import { adminClient } from '../../lib/adminClient';

export function createClient() {
  // Realtime must use the same verified session as admin API requests.
  // A fresh client with the default storage key silently subscribes as anon.
  return adminClient;
}
