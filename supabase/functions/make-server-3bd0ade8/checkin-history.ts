export async function readCheckinHistory(bookingId: string, rawIndex: string, get: (key: string) => Promise<any>) {
  if (!/^\d+$/.test(rawIndex) || !Number.isSafeInteger(Number(rawIndex))) {
    return { status: 400 as const, body: { success: false, error: 'Invalid passenger index' } };
  }
  try {
    const index = Number(rawIndex);
    const booking = await get(bookingId);
    if (!booking || !Array.isArray(booking.passengers) || index >= booking.passengers.length) {
      return { status: 404 as const, body: { success: false, error: 'Passenger not found' } };
    }
    const history = await get(`checkins_${bookingId}_${index}`);
    const current = await get(`checkin_${bookingId}_${index}_${booking.selectedDate}`);
    return { status: 200 as const, body: { success: true, checkIns: Array.isArray(history) && history.length ? history : current ? [current] : [] } };
  } catch {
    return { status: 503 as const, body: { success: false, error: 'Check-in history temporarily unavailable' } };
  }
}
