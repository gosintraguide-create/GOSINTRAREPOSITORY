import { Clock, MapPin, ArrowLeft, Star, Check, Info, Lightbulb, ChevronRight, Calendar, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";

interface AttractionDetailPageProps {
  onNavigate: (page: string) => void;
  attractionId: string;
}

export function AttractionDetailPage({ onNavigate, attractionId }: AttractionDetailPageProps) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    setContent(loadContent());
  }, []);

  const attraction = content.attractions[attractionId];

  if (!attraction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-foreground">Attraction not found</h2>
          <Button onClick={() => onNavigate("attractions")}>
            Back to Attractions
          </Button>
        </div>
      </div>
    );
  }

  // Set default selected option
  useEffect(() => {
    if (attraction.parkOnlyPrice && !selectedOption) {
      setSelectedOption("full");
    }
  }, [attraction, selectedOption]);

  const getCurrentPrice = () => {
    if (attraction.parkOnlyPrice) {
      return selectedOption === "parkOnly" ? attraction.parkOnlyPrice : attraction.price;
    }
    return attraction.price;
  };

  const handlePurchase = () => {
    alert(`Booking ${ticketQuantity} ticket(s) for ${attraction.name}. Total: €${getCurrentPrice() * ticketQuantity}`);
  };

  return (
    <div className="flex-1">
      {/* Hero Section with Image */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src={attraction.image}
          alt={attraction.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-12 sm:pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <MapPin className="h-4 w-4 text-white" />
                  <span className="text-white">{attraction.ticketPrice}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="text-white">{attraction.duration}</span>
                </div>
              </div>
              <h1 className="mb-4 text-white drop-shadow-lg">{attraction.name}</h1>
              <p className="max-w-3xl text-white/90 drop-shadow-md">
                {attraction.fullDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="mb-4 text-foreground">About This Attraction</h2>
                <p className="mb-6 text-muted-foreground">
                  {attraction.longDescription}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h3 className="mb-4 text-foreground">Highlights</h3>
                <ul className="space-y-3">
                  {attraction.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visitor Tips */}
              <div>
                <h3 className="mb-4 text-foreground">Visitor Tips</h3>
                <div className="grid gap-3">
                  {attraction.tips.map((tip, index) => (
                    <div key={index} className="rounded-lg border border-border bg-secondary/30 p-4">
                      <p className="text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Information */}
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border-border p-6">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Clock className="h-5 w-5" />
                    <h4 className="text-foreground">Opening Hours</h4>
                  </div>
                  <p className="text-muted-foreground">{attraction.hours}</p>
                </Card>

                <Card className="border-border p-6">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" />
                    <h4 className="text-foreground">Recommended Time</h4>
                  </div>
                  <p className="text-muted-foreground">{attraction.duration}</p>
                </Card>
              </div>
            </div>

            {/* Right Column - Booking */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-border p-6">
                <h3 className="mb-6 text-foreground">Book Your Visit</h3>

                <div className="mb-6 space-y-4">
                  <div>
                    <Label htmlFor="date" className="text-foreground">Select Date</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        className="border-border pl-10"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quantity" className="text-foreground">Number of Tickets</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 border-border"
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={ticketQuantity}
                        onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="border-border text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 border-border"
                        onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {attraction.parkOnlyPrice && (
                    <div>
                      <Label htmlFor="ticketOption" className="text-foreground">Ticket Option</Label>
                      <div className="mt-2">
                        <select
                          id="ticketOption"
                          className="border-border px-4 py-2 w-full"
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        >
                          <option value="full">
                            {attraction.name} & Park - €{attraction.price}.00
                          </option>
                          <option value="parkOnly">
                            {attraction.name} Park Only - €{attraction.parkOnlyPrice}.00
                          </option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6 rounded-lg bg-secondary/50 p-6">
                  <div className="mb-3 flex items-center justify-between text-muted-foreground">
                    <span>
                      {attraction.parkOnlyPrice 
                        ? (selectedOption === "full" ? attraction.name + " & Park" : attraction.name + " Park Only")
                        : attraction.name} (×{ticketQuantity})
                    </span>
                    <span>€{getCurrentPrice() * ticketQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-foreground">Total</span>
                    <span className="text-2xl text-primary">€{getCurrentPrice() * ticketQuantity}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handlePurchase}
                >
                  <Star className="mr-2 h-5 w-5" />
                  Buy Tickets
                </Button>

                <div className="mt-6 space-y-2 rounded-lg bg-primary/5 p-4">
                  <p className="text-foreground">✓ Skip-the-line entrance</p>
                  <p className="text-foreground">✓ Instant digital ticket</p>
                  <p className="text-foreground">✓ Valid for selected date</p>
                  <p className="text-foreground">✓ Easy mobile access</p>
                </div>

                <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <h4 className="mb-2 text-foreground">💡 Pro Tip</h4>
                  <p className="text-muted-foreground">
                    Combine with a Go Sintra day pass for unlimited transport between all attractions!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-accent text-accent hover:bg-accent/10"
                    onClick={() => onNavigate("buy-ticket")}
                  >
                    Get Day Pass
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}