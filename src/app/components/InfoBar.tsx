import { useState, useEffect } from "react";
import { Clock, Navigation } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getTranslation } from "../lib/translations/loader";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/info-bar`;
const REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = "infobar_cache";

interface InfoBarCache {
  weather: { temp: number; description: string; icon: string } | null;
  traffic: { level: string } | null;
  cachedAt: number;
}

function readCache(): InfoBarCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: InfoBarCache = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > REFETCH_INTERVAL) return null; // stale
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(weather: InfoBarCache["weather"], traffic: InfoBarCache["traffic"]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ weather, traffic, cachedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable (private browsing quota); silently skip
  }
}

function getLisbonTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

// Map OWM icon codes to descriptive emoji
function weatherEmoji(icon: string): string {
  const code = icon.replace(/[dn]$/, "");
  const map: Record<string, string> = {
    "01": "☀️", "02": "⛅", "03": "🌥️", "04": "☁️",
    "09": "🌧️", "10": "🌦️", "11": "⛈️", "13": "❄️", "50": "🌫️",
  };
  return map[code] ?? "🌤️";
}

const TRAFFIC_STYLES: Record<string, { bg: string; dot: string }> = {
  clear:  { bg: "bg-green-500/90",      dot: "bg-green-300"  },
  light:  { bg: "bg-lime-500/90",       dot: "bg-lime-300"   },
  medium: { bg: "bg-amber-500/90",      dot: "bg-amber-300"  },
  heavy:  { bg: "bg-red-600/90",        dot: "bg-red-300"    },
};

function Divider() {
  return <div className="h-5 w-px bg-white/20 hidden sm:block" />;
}

interface InfoBarProps {
  language?: string;
}

export function InfoBar({ language = "en" }: InfoBarProps) {
  const t = getTranslation(language).infoBar;
  const cached = readCache();
  const [time, setTime]       = useState(getLisbonTime);
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(cached?.weather ?? null);
  const [traffic, setTraffic] = useState<{ level: string } | null>(cached?.traffic ?? null);
  const [loading, setLoading] = useState(!cached); // skip loading state when cache is warm

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setTime(getLisbonTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch weather + traffic (skip if sessionStorage cache is fresh)
  useEffect(() => {
    // If we already initialised state from a warm cache, defer the next fetch
    // until the cache would actually be stale.
    const cacheAge = cached ? Date.now() - cached.cachedAt : REFETCH_INTERVAL;
    const initialDelay = Math.max(0, REFETCH_INTERVAL - cacheAge);

    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const w = data.weather ?? null;
          const tr = data.traffic ?? null;
          setWeather(w);
          setTraffic(tr);
          writeCache(w, tr);
        }
      } catch (_) {
        // silently degrade
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // If cache was warm, schedule first real fetch only when cache expires
    const timeout = initialDelay > 0
      ? setTimeout(() => { fetchData(); }, initialDelay)
      : null;
    if (initialDelay === 0) fetchData();

    const id = setInterval(fetchData, REFETCH_INTERVAL);
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      clearInterval(id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trafficLabels: Record<string, string> = {
    clear: t.clearTraffic,
    light: t.lightTraffic,
    medium: t.mediumTraffic,
    heavy: t.heavyTraffic,
  };
  const trafficStyles = traffic ? (TRAFFIC_STYLES[traffic.level] ?? TRAFFIC_STYLES.medium) : null;
  const trafficLabel = traffic ? (trafficLabels[traffic.level] ?? trafficLabels.medium) : null;

  return (
    <div className="bg-[#0A4D5C] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 sm:gap-6 flex-wrap">

        {/* ── Time ── */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/50 shrink-0" />
          <span className="text-base font-bold tracking-wide tabular-nums">{time}</span>
        </div>

        {/* ── Weather — always visible; shows placeholder until API responds ── */}
        <Divider />
        <div className="flex items-center gap-2">
          {weather ? (
            <>
              {/* OWM icon — falls back to emoji if image fails */}
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                alt={weather.description}
                className="h-8 w-8 -my-1 drop-shadow-sm"
                onError={(e) => {
                  const span = document.createElement("span");
                  span.textContent = weatherEmoji(weather.icon);
                  span.className = "text-lg leading-none";
                  (e.target as HTMLImageElement).replaceWith(span);
                }}
              />
              <span className="text-xl font-extrabold leading-none">
                {weather.temp}°
              </span>
              <span className="text-xs font-medium text-white/60 capitalize hidden sm:block max-w-[120px] truncate">
                {weather.description}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg opacity-50">🌤</span>
              <span className="text-base font-bold text-white/40">--°</span>
              <span className="text-xs text-white/30 hidden sm:block">Sintra</span>
            </>
          )}
        </div>

        {/* ── Traffic ── */}
        {loading && !traffic ? (
          <>
            <Divider />
            <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
          </>
        ) : trafficStyles ? (
          <>
            <Divider />
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-white/50 shrink-0" />
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold tracking-wide text-white ${trafficStyles.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${trafficStyles.dot} animate-pulse`} />
                {trafficLabel}
              </span>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}
