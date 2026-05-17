import { useState, useEffect } from "react";
import { Clock, Navigation } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/info-bar`;
const REFETCH_INTERVAL = 10 * 60 * 1000;

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

const TRAFFIC_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  clear:  { label: "Clear",  bg: "bg-green-500/90",      dot: "bg-green-300"  },
  light:  { label: "Light",  bg: "bg-lime-500/90",       dot: "bg-lime-300"   },
  medium: { label: "Medium", bg: "bg-amber-500/90",      dot: "bg-amber-300"  },
  heavy:  { label: "Heavy",  bg: "bg-red-600/90",        dot: "bg-red-300"    },
};

function Divider() {
  return <div className="h-5 w-px bg-white/20 hidden sm:block" />;
}

export function InfoBar() {
  const [time, setTime]       = useState(getLisbonTime);
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(null);
  const [traffic, setTraffic] = useState<{ level: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setTime(getLisbonTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch weather + traffic
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          if (data.weather) setWeather(data.weather);
          if (data.traffic) setTraffic(data.traffic);
        }
      } catch (_) {
        // silently degrade
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    const id = setInterval(fetchData, REFETCH_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const trafficCfg = traffic ? (TRAFFIC_CONFIG[traffic.level] ?? TRAFFIC_CONFIG.medium) : null;

  return (
    <div className="bg-[#0A4D5C] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 sm:gap-6 flex-wrap">

        {/* ── Time ── */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/50 shrink-0" />
          <span className="text-base font-bold tracking-wide tabular-nums">{time}</span>
          <span className="text-[11px] font-medium text-white/45 uppercase tracking-wider hidden sm:inline">
            Lisbon
          </span>
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
        ) : trafficCfg ? (
          <>
            <Divider />
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-white/50 shrink-0" />
              <span className="text-xs text-white/60 hidden sm:block">
                Village traffic
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold tracking-wide text-white ${trafficCfg.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${trafficCfg.dot} animate-pulse`} />
                {trafficCfg.label}
              </span>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}
