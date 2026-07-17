/**
 * Google Places (New) API — fetches the live rating + review count for the business.
 *
 * Configure via environment variables:
 *   VITE_GOOGLE_PLACES_API_KEY  — your Google Cloud API key (restrict to hoponsintra.com)
 *   VITE_GOOGLE_PLACE_ID        — your Google Place ID (e.g. ChIJ...)
 *
 * Results are cached in localStorage for 24 hours so the API is called at most
 * once per day per browser.
 */

const CACHE_KEY = "hop-google-rating";
const CACHE_TS_KEY = "hop-google-rating-ts";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface GooglePlaceRating {
  rating: number;
  reviewCount: number;
}

export async function fetchGoogleRating(): Promise<GooglePlaceRating | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;
  const placeId = import.meta.env.VITE_GOOGLE_PLACE_ID as string | undefined;

  if (!apiKey || !placeId) return null;

  // ── 1. Return cached result if still fresh ────────────────────────────────
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (cached && ts && Date.now() - parseInt(ts, 10) < CACHE_TTL_MS) {
      return JSON.parse(cached) as GooglePlaceRating;
    }
  } catch {
    /* ignore parse errors — just re-fetch */
  }

  // ── 2. Fetch from Google Places API (New) ─────────────────────────────────
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json() as { rating?: number; userRatingCount?: number };
    if (!data.rating) return null;

    const result: GooglePlaceRating = {
      rating: Math.round(data.rating * 10) / 10, // one decimal place
      reviewCount: data.userRatingCount ?? 0,
    };

    // ── 3. Cache it ───────────────────────────────────────────────────────────
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));

    return result;
  } catch {
    return null; // network error, API quota, etc. — show fallback values
  }
}
