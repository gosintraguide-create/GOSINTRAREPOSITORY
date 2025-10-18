import { useState, useEffect } from "react";
import { Star, Clock, MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";

interface AttractionsPageProps {
  onNavigate: (page: string) => void;
}

export function AttractionsPage({ onNavigate }: AttractionsPageProps) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    setContent(loadContent());
  }, []);

  // Create attractions array from CMS content
  const attractions = Object.entries(content.attractions).map(([id, attr]) => ({
    id,
    name: attr.name,
    description: attr.description,
    duration: attr.duration,
    price: attr.price,
    parkOnlyPrice: attr.parkOnlyPrice,
    image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop", // Default image
  }));

  // Set specific images for known attractions
  const attractionImages: { [key: string]: string } = {
    "pena-palace": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5hJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwMnww&ixlib=rb-4.1.0&q=80&w=1080",
    "quinta-regaleira": "https://images.unsplash.com/photo-1643208143695-3c79c2f36cce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWludGElMjByZWdhbGVpcmElMjBzaW50cmF8ZW58MXx8fHwxNzYwMTQwNjAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "moorish-castle": "https://images.unsplash.com/photo-1555881674-7d4f8e8867e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29yaXNoJTIwY2FzdGxlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "monserrate-palace": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zZXJyYXRlJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "sintra-palace": "https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
        <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <MapPin className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            Sintra's Top Attractions
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Discover UNESCO World Heritage palaces, castles, and gardens with convenient hop-on/hop-off access. 
            Add attraction tickets during booking to skip the lines!
          </p>
        </div>
      </section>

      {/* Attractions Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((attraction, index) => (
              <div
                key={attraction.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={attractionImages[attraction.id] || attraction.image}
                    alt={attraction.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-2 flex items-center gap-2">
                    {attraction.parkOnlyPrice ? (
                      <div className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <span className="text-white">From €{attraction.parkOnlyPrice}</span>
                      </div>
                    ) : (
                      <div className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <span className="text-white">€{attraction.price}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Clock className="h-3 w-3 text-white" />
                      <span className="text-white">{attraction.duration}</span>
                    </div>
                  </div>
                  <h3 className="mb-2 text-white drop-shadow-lg">{attraction.name}</h3>
                  <p className="mb-4 text-white/90 drop-shadow-md line-clamp-2">{attraction.description}</p>
                  <Button
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={() => onNavigate(attraction.id)}
                  >
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-foreground">Ready to Explore?</h2>
          <p className="mb-8 text-muted-foreground">
            Get unlimited access to all these destinations with a single day pass
          </p>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            Book Your Pass
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}