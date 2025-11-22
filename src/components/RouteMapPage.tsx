import { MapPin, Navigation } from "lucide-react";
import { getTranslation } from "../lib/translations";
import { Button } from "./ui/button";

interface RouteMapPageProps {
  onNavigate: (page: string) => void;
  language: string;
}

export function RouteMapPage({
  onNavigate,
  language,
}: RouteMapPageProps) {
  const content = getTranslation(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <MapPin className="size-4 text-primary" />
              <span className="text-sm text-primary">
                {content.routeMap.badge}
              </span>
            </div>
            <h1 className="mb-4">{content.routeMap.title}</h1>
            <p className="text-muted-foreground">
              {content.routeMap.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            {/* Map Container */}
            <div className="overflow-hidden rounded-lg border bg-white shadow-lg">
              <div className="aspect-[4/3] w-full">
                <iframe
                  src="https://www.google.com/maps/d/embed?mid=1ArqMSGqEk4309KwRRH6OEFy8y2k3oWs"
                  className="h-full w-full"
                  title={content.routeMap.mapTitle}
                  loading="lazy"
                  style={{ border: 0 }}
                ></iframe>
              </div>
            </div>

            {/* Information Card */}
            <div className="mt-8 rounded-lg border bg-card p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Navigation className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">
                    {content.routeMap.infoTitle}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {content.routeMap.infoDescription}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary"></div>
                      {content.routeMap.tip1}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary"></div>
                      {content.routeMap.tip2}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary"></div>
                      {content.routeMap.tip3}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-8 text-center">
              <Button
                size="lg"
                onClick={() => onNavigate("buy-ticket")}
                className="gap-2"
              >
                {content.routeMap.ctaButton}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                {content.routeMap.ctaSubtext}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
