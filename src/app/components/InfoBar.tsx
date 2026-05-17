import { useState, useEffect } from "react";
import { Clock, Cloud, Car } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/info-bar`;
const REFETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

function getLisbonTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

const TRAFFIC_STYLES: Record<string, { label: string; colour: string }> = {
  clear:  { label: "Clear",  colour: "text-green-300" },
  medium: { label: "Medium", colour: "text-amber-300" },
  heavy:  { label: "Heavy",  colour: "text-red-400"   },
};

export function InfoBar() {
  const [time, setTime]       = useState(getLisbonTime);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [traffic, setTraffic] = useState<{ level: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Clock — tick every 60 s
  useEffect(() => {
    const id = setInterval(() => setTime(getLisbonTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Weather + traffic — fetch on mount then every 10 min
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
        // silently fail — bar just shows whatever data it has
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    const id = setInterval(fetchData, REFETCH_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // If everything is still loading and nothing to show, render nothing
  if (loading && !weather && !traffic) {
    return (
      <div className="bg-[#0A4D5C] py-1.5 px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-3 w-20 animate-pulse rounded-full bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  const trafficStyle = traffic ? TRAFFIC_STYLES[traffic.level] ?? TRAFFIC_STYLES.medium : null;

  // Capitalise first letter of weather description
  const weatherLabel = weather
    ? `${weather.temp}°C · ${weather.description.charAt(0).toUpperCase()}${weather.description.slice(1)}`
    : null;

  return (
    <div className="bg-[#0A4D5C] py-1.5 px-4 text-xs text-white/90">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 sm:gap-5 flex-wrap">
        {/* Time */}
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="h-3 w-3 opacity-70" />
          <span>{time}</span>
          <span className="opacity-50 text-[10px]">Lisbon</span>
        </span>

        {weatherLabel && (
          <>
            <span className="opacity-30 hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Cloud className="h-3 w-3 opacity-70" />
              <span>{weatherLabel}</span>
            </span>
          </>
        )}

        {trafficStyle && (
          <>
            <span className="opacity-30 hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Car className="h-3 w-3 opacity-70" />
              <span>Traffic: </span>
              <span className={`font-semibold ${trafficStyle.colour}`}>
                {trafficStyle.label}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
