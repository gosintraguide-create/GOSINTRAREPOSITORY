import { MapPin } from "lucide-react";

const ROUTE_1_STOPS = [
  "Train Station",
  "Historical Center North",
  "Moorish Castle",
  "Pena Palace",
  "Historical Center South",
];

const ROUTE_2_STOPS = [
  "Quinta da Regaleira",
  "Seteais",
  "Monserrate Palace",
  "Train Station",
  "Historical Center North",
];

export function RouteOverview() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2">Our Two Circular Routes</h2>
          <p className="text-muted-foreground">
            All stops served every 30 minutes • No need to change vehicles
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
              <h3 className="text-primary">Route 1</h3>
            </div>

            {/* Route Visualization */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-primary/30" />
              
              <div className="space-y-3">
                {ROUTE_1_STOPS.map((stop, index) => {
                  const isShared = stop === "Train Station" || stop === "Historical Center North";
                  
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
                          <p className="text-xs text-muted-foreground">Both routes</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Loop back indicator */}
                <div className="relative flex items-center gap-3 pl-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-px w-8 bg-primary/30" />
                    <span>loops back</span>
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
              <h3 className="text-accent">Route 2</h3>
            </div>

            {/* Route Visualization */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-accent/30" />
              
              <div className="space-y-3">
                {ROUTE_2_STOPS.map((stop, index) => {
                  const isShared = stop === "Train Station" || stop === "Historical Center North";
                  
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
                          <p className="text-xs text-muted-foreground">Both routes</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Loop back indicator */}
                <div className="relative flex items-center gap-3 pl-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-px w-8 bg-accent/30" />
                    <span>loops back</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-sm text-foreground">
                <strong>One Pass, Both Routes</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Your day pass gives you unlimited access to both routes. Our vehicles visit all stops every 30 minutes from 9 AM to 7 PM, and you never need to change vehicles - stay on board as routes connect at Train Station and Historical Center North.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}