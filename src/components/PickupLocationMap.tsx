import { useState } from "react";
import { MapPin, Clock, Info, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PickupLocationMapProps {
  selectedLocation: string;
  onLocationSelect?: (location: string) => void;
}

const LOCATION_DETAILS = [
  {
    id: "sintra-train-station",
    name: "Sintra Train Station",
    description: "Main arrival point for visitors coming from Lisbon",
    image: "https://images.unsplash.com/photo-1674930113950-ef9a5883668d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0cmFpbiUyMHN0YXRpb24lMjBQb3J0dWdhbHxlbnwxfHx8fDE3NjI5NjU0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Located in the heart of Sintra, just steps from the historic center. Our vehicles pick up right outside the main station entrance.",
    highlights: ["Easy access from Lisbon", "Central location", "Frequent departures"],
    routes: ["route1", "route2"]
  },
  {
    id: "sintra-town-center",
    name: "Historical Center North",
    description: "Historic center with cafés, shops, and monuments",
    image: "https://images.unsplash.com/photo-1731009918187-f3475180f5da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0b3duJTIwY2VudGVyJTIwUG9ydHVnYWx8ZW58MXx8fHwxNzYyOTY1NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Pick up in the charming historic center, surrounded by local restaurants, pastry shops, and boutiques. Perfect if you're staying in the old town.",
    highlights: ["Historic atmosphere", "Dining options nearby", "Walking distance to attractions"],
    routes: ["route1", "route2"]
  },
];

const ROUTE_1_DETAILS = [
  {
    id: "sintra-train-station",
    name: "Sintra Train Station",
    description: "Connection point for both routes",
    image: "https://images.unsplash.com/photo-1674930113950-ef9a5883668d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0cmFpbiUyMHN0YXRpb24lMjBQb3J0dWdhbHxlbnwxfHx8fDE3NjI5NjU0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Located in the heart of Sintra, just steps from the historic center. Our vehicles pick up right outside the main station entrance. Connection point for both routes.",
    highlights: ["Easy access from Lisbon", "Both routes stop here", "Frequent departures"],
    shared: true
  },
  {
    id: "center-2",
    name: "Historical Center North",
    description: "Historic center with cafés and shops",
    image: "https://images.unsplash.com/photo-1731009918187-f3475180f5da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0b3duJTIwY2VudGVyJTIwUG9ydHVnYWx8ZW58MXx8fHwxNzYyOTY1NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Pick up in the charming historic center, surrounded by local restaurants, pastry shops, and boutiques. Connection point for both routes.",
    highlights: ["Historic atmosphere", "Both routes stop here", "Dining options nearby"],
    shared: true
  },
  {
    id: "moorish-castle",
    name: "Moorish Castle",
    description: "Ancient fortress with medieval walls",
    image: "https://images.unsplash.com/photo-1651520011190-6f37b5213684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNb29yaXNoJTIwQ2FzdGxlJTIwU2ludHJhfGVufDF8fHx8MTc2Mjk2NTQ4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Visit this 10th-century Moorish fortification perched on the hilltop, offering spectacular views over the region.",
    highlights: ["Historical significance", "Panoramic vistas", "Authentic medieval ruins"],
    shared: false
  },
  {
    id: "pena-palace",
    name: "Pena Palace",
    description: "Iconic hilltop castle with panoramic views",
    image: "https://images.unsplash.com/photo-1650462817648-106f4640e636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQZW5hJTIwUGFsYWNlJTIwU2ludHJhfGVufDF8fHx8MTc2Mjk2NTQ3OXww&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Visit Sintra's most famous landmark. Our pickup point is conveniently located at the palace entrance area.",
    highlights: ["Stunning views", "Most visited attraction", "Great photo opportunities"],
    shared: false
  },
  {
    id: "center-1",
    name: "Historical Center South",
    description: "Town center near National Palace",
    image: "https://images.unsplash.com/photo-1692651763114-6b36c2df12f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjBOYXRpb25hbCUyMFBhbGFjZXxlbnwxfHx8fDE3NjI5NjU0ODF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Stop in the historic center near the iconic National Palace with its distinctive twin chimneys.",
    highlights: ["Royal heritage", "Central location", "Iconic architecture"],
    shared: false
  },
];

const ROUTE_2_DETAILS = [
  {
    id: "quinta-regaleira",
    name: "Quinta da Regaleira",
    description: "Mystical estate with initiation wells and caves",
    image: "https://images.unsplash.com/photo-1627841540613-549c6cb34da4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxRdWludGElMjBkYSUyMFJlZ2FsZWlyYSUyMFNpbnRyYXxlbnwxfHx8fDE3NjI5NjU0ODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Visit this enchanting estate featuring mysterious gardens, underground tunnels, and the famous Initiation Well. Pickup at the main entrance.",
    highlights: ["Mysterious architecture", "Beautiful gardens", "Unique experience"],
    shared: false
  },
  {
    id: "seteais",
    name: "Seteais",
    description: "Historic palace and scenic viewpoint",
    image: "https://images.unsplash.com/photo-1590073844006-33c7c2c441e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjBwYWxhY2UlMjB2aWV3fGVufDF8fHx8MTc2Mjk2NTQ4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Stop at this magnificent neoclassical palace with breathtaking views. Now a luxury hotel, the exterior and gardens are open to visitors.",
    highlights: ["Stunning architecture", "Scenic viewpoint", "Historical significance"],
    shared: false
  },
  {
    id: "monserrate-palace",
    name: "Monserrate Palace",
    description: "Romantic palace with exotic gardens",
    image: "https://images.unsplash.com/photo-1711743167330-65c9988061ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNb25zZXJyYXRlJTIwUGFsYWNlJTIwU2ludHJhfGVufDF8fHx8MTc2Mjk2NTQ4MXww&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Pick up at this stunning 19th-century palace surrounded by botanical gardens featuring plants from around the world. A hidden gem of Sintra.",
    highlights: ["Exotic botanical gardens", "Romantic architecture", "Peaceful atmosphere"],
    shared: false
  },
  {
    id: "sintra-train-station",
    name: "Sintra Train Station",
    description: "Connection point for both routes",
    image: "https://images.unsplash.com/photo-1674930113950-ef9a5883668d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0cmFpbiUyMHN0YXRpb24lMjBQb3J0dWdhbHxlbnwxfHx8fDE3NjI5NjU0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Located in the heart of Sintra, just steps from the historic center. Our vehicles pick up right outside the main station entrance. Connection point for both routes.",
    highlights: ["Easy access from Lisbon", "Both routes stop here", "Frequent departures"],
    shared: true
  },
  {
    id: "center-2",
    name: "Historical Center North",
    description: "Historic center with cafés and shops",
    image: "https://images.unsplash.com/photo-1731009918187-f3475180f5da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaW50cmElMjB0b3duJTIwY2VudGVyJTIwUG9ydHVnYWx8ZW58MXx8fHwxNzYyOTY1NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    info: "Pick up in the charming historic center, surrounded by local restaurants, pastry shops, and boutiques. Connection point for both routes.",
    highlights: ["Historic atmosphere", "Both routes stop here", "Dining options nearby"],
    shared: true
  },
];

export function PickupLocationMap({ selectedLocation, onLocationSelect }: PickupLocationMapProps) {
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  const handleLocationClick = (locationId: string) => {
    // Toggle expansion
    setExpandedLocation(expandedLocation === locationId ? null : locationId);
    
    // Select the location if callback provided
    if (onLocationSelect) {
      onLocationSelect(locationId);
    }
  };

  const renderRoute = (routeDetails: typeof ROUTE_1_DETAILS, routeNumber: number, routeColor: string) => {
    return (
      <div className="relative">
        {/* Vertical route line */}
        <div 
          className="absolute left-5 top-0 bottom-0 w-0.5" 
          style={{ 
            background: routeColor,
            backgroundImage: `repeating-linear-gradient(0deg, ${routeColor}, ${routeColor} 8px, transparent 8px, transparent 16px)`,
          }} 
        />
        
        <div className="space-y-0">
          {routeDetails.map((location, index) => {
            const isSelected = selectedLocation === location.id;
            const isExpanded = expandedLocation === location.id;
            const isLast = index === routeDetails.length - 1;
            
            return (
              <div key={`${routeNumber}-${location.id}`} className="relative">
                {/* Route stop indicator */}
                <div className="absolute left-0 top-3 z-10">
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    {/* Outer ring */}
                    <div className={`absolute inset-1 rounded-full border-2 ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-primary/30 bg-white'
                    }`} />
                    {/* Inner circle */}
                    <div 
                      className={`relative flex h-6 w-6 items-center justify-center rounded-full text-xs shadow-md`}
                      style={{ backgroundColor: isSelected ? '#D97843' : routeColor }}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : location.shared ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      ) : (
                        <span className="text-white text-xs">{index + 1}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location card */}
                <div className="ml-14 mb-1">
                  <div
                    className={`rounded border transition-all duration-200 overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/5 shadow-sm'
                        : 'border-border bg-white hover:border-primary/30'
                    }`}
                    onClick={() => handleLocationClick(location.id)}
                  >
                    {/* Location header */}
                    <div className="p-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {location.shared && (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-0.5 bg-white border border-border px-1.5 py-0.5 rounded">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#0A4D5C' }} />
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#D97843' }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">Both routes</span>
                            </div>
                          )}
                          {isSelected && (
                            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Pickup
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm truncate ${
                          isSelected ? 'text-accent' : 'text-foreground'
                        }`}>
                          {location.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {location.description}
                        </p>
                      </div>
                      <div className={`transform transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}>
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <div className={`transition-all duration-200 ease-in-out ${
                      isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-border">
                        {/* Location image */}
                        <div className="relative h-32 overflow-hidden">
                          <ImageWithFallback
                            src={location.image}
                            alt={location.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex items-center gap-1.5 text-white">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">Every 30 min • 9 AM - 7 PM</span>
                            </div>
                          </div>
                        </div>

                        {/* Location info */}
                        <div className="p-2 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {location.info}
                          </p>

                          {/* Highlights */}
                          <div className="space-y-1">
                            <div className="grid gap-1">
                              {location.highlights.map((highlight, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <div className="h-1 w-1 rounded-full bg-accent flex-shrink-0" />
                                  <span>{highlight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distance/time between stops */}
                {!isLast && (
                  <div className="ml-14 py-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="h-3 w-px" style={{ backgroundColor: `${routeColor}40` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Compact info header */}
      <div className="rounded bg-primary/5 border border-primary/20 px-2 py-1">
        <p className="text-[10px] text-muted-foreground">
          <Info className="inline h-2.5 w-2.5 mr-1 text-primary" />
          Two circular routes • Click any stop to select
        </p>
      </div>

      {/* Selected pickup summary - more prominent - MOVED TO TOP */}
      {selectedLocation !== "other" && !expandedLocation && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary flex-shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground mb-0.5">Your Pickup Location</p>
              <p className="text-sm text-foreground font-medium truncate">
                {[...ROUTE_1_DETAILS, ...ROUTE_2_DETAILS].find(loc => loc.id === selectedLocation)?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Routes Container */}
      <div className="space-y-1.5">
        {/* Route 1 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] text-primary">Route 1</span>
          </div>
          {renderRoute(ROUTE_1_DETAILS, 1, '#0A4D5C')}
        </div>

        {/* Route 2 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[10px] text-accent">Route 2</span>
          </div>
          {renderRoute(ROUTE_2_DETAILS, 2, '#D97843')}
        </div>
      </div>
    </div>
  );
}