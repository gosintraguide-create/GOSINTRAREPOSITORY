export function createNotificationTracker() {
  let seen: Set<string> | null = null;
  return (items: Array<{ id: string }>) => {
    const incoming = items.filter((item) => typeof item.id === 'string');
    if (!seen) {
      seen = new Set(incoming.map((item) => item.id));
      return [];
    }
    const added = incoming.filter((item) => !seen!.has(item.id));
    for (const item of incoming) seen.add(item.id);
    return added;
  };
}

export function isPickupKey(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('PICKUP_');
}
