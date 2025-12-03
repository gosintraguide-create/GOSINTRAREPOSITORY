import { MapPin } from "lucide-react";
import { getTranslation } from "../lib/translations";
import { Button } from "./ui/button";

interface RouteOverviewProps {
  language?: string;
  onNavigate?: (page: string) => void;
}

export function RouteOverview({ language = "en", onNavigate }: RouteOverviewProps) {
  const content = getTranslation(language);

  const ROUTE_1_STOPS = [
    content.routes.stops.trainStation,
    content.routes.stops.historicalCenterNorth,
    content.routes.stops.moorishCastle,
    content.routes.stops.penaPalace,
    content.routes.stops.historicalCenterSouth,
  ];

  const ROUTE_2_STOPS = [
    content.routes.stops.quintaRegaleira,
    content.routes.stops.seteais,
    content.routes.stops.monserratePalace,
    content.routes.stops.trainStation,
    content.routes.stops.historicalCenterNorth,
  ];

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-20 lg:py-24 pb-8 sm:pb-10 lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4">{content.routes.title}</h2>
          <p className="text-muted-foreground">
            {content.routes.subtitle}
          </p>
        </div>

        {/* Routes Display */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Route 1 */}
          <div className="rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-sm text-white">1</span>
              </div>
              <h3 className="text-primary">{content.routes.route1}</h3>
            </div>

            {/* Route Visualization */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-primary/30" />
              
              <div className="space-y-3">
                {ROUTE_1_STOPS.map((stop, index) => {
                  const isShared = stop === content.routes.stops.trainStation || stop === content.routes.stops.historicalCenterNorth;
                  
                  return (
                    <div key={index} className="relative flex items-center gap-3">
                      {/* Stop indicator */}
                      <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white">
                        {isShared ? (
                          <div className="flex gap-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          </div>
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      {/* Stop name */}
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{stop}</p>
                        {isShared && (
                          <p className="text-xs text-muted-foreground">{content.routes.bothRoutes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Loop back indicator */}
                <div className="relative flex items-center gap-3 pl-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-px w-8 bg-primary/30" />
                    <span>{content.routes.loopsBack}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route 2 */}
          <div className="rounded-2xl border-2 border-accent/20 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <span className="text-sm text-white">2</span>
              </div>
              <h3 className="text-accent">{content.routes.route2}</h3>
            </div>

            {/* Route Visualization */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-accent/30" />
              
              <div className="space-y-3">
                {ROUTE_2_STOPS.map((stop, index) => {
                  const isShared = stop === content.routes.stops.trainStation || stop === content.routes.stops.historicalCenterNorth;
                  
                  return (
                    <div key={index} className="relative flex items-center gap-3">
                      {/* Stop indicator */}
                      <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-white">
                        {isShared ? (
                          <div className="flex gap-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          </div>
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                        )}
                      </div>
                      {/* Stop name */}
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{stop}</p>
                        {isShared && (
                          <p className="text-xs text-muted-foreground">{content.routes.bothRoutes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Loop back indicator */}
                <div className="relative flex items-center gap-3 pl-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-px w-8 bg-accent/30" />
                    <span>{content.routes.loopsBack}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Button */}
        {onNavigate && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => onNavigate("route-map")}
              variant="outline"
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              {content.routes.viewMapButton}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}