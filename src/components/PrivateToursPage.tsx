import { ArrowRight, Check, Star, Users, Clock, MapPin, Sparkles, Shield, Heart, Camera, Award, MessageCircle, Car, Rocket } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { featureFlags } from "../lib/featureFlags";

interface PrivateToursPageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function PrivateToursPage({ onNavigate, language = "en" }: PrivateToursPageProps) {
  // Check if Private Tours feature is enabled
  if (!featureFlags.privateToursEnabled) {
    return (
      <div className="flex-1">
        {/* Coming Soon Hero */}
        <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
          </div>
          
          <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-6 py-3 backdrop-blur-sm">
              <Rocket className="h-6 w-6 text-accent" />
              <span className="text-white">Coming Soon</span>
            </div>
            
            <h1 className="mb-6 text-white">
              Private Tours of Sintra
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90 sm:text-2xl">
              We're preparing something special for those seeking an exclusive, 
              personalized Sintra experience.
            </p>
            
            <div className="mb-12 space-y-4">
              <p className="text-lg text-white/80">
                Stay tuned for our premium private tour service featuring:
              </p>
              <div className="mx-auto max-w-2xl space-y-3">
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>Dedicated expert local guides</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>Custom itineraries tailored to your interests</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>Flexible scheduling and exclusive experiences</span>
                </div>
              </div>
            </div>

            <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
                onClick={() => onNavigate("live-chat")}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Get Notified When We Launch
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                onClick={() => onNavigate("buy-ticket")}
              >
                Explore Our Day Pass
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-white/70">
              In the meantime, check out our hop-on/hop-off day pass for exploring Sintra at your own pace
            </p>
          </div>
        </section>

        {/* Why Wait Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-foreground">Want to Explore Sintra Today?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Our hop-on/hop-off day pass is already available and perfect for independent travelers!
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">Professional Guides</h3>
                <p className="text-sm text-muted-foreground">
                  All our vehicles are driven by expert local guides
                </p>
              </Card>
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">Flexible Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Hop on and off at your own pace, 9am to 8pm daily
                </p>
              </Card>
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">Great Value</h3>
                <p className="text-sm text-muted-foreground">
                  Unlimited rides for a full day at an affordable price
                </p>
              </Card>
            </div>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigate("buy-ticket")}
              >
                Book Your Day Pass Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Full Private Tours Page (when enabled)
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm text-white">Premium Experience</span>
            </div>
            
            <h1 className="mb-6 text-white">
              Private Tours of Sintra
            </h1>
            
            <p className="mx-auto mb-8 max-w-3xl text-lg text-white/90 sm:text-xl">
              Experience the magic of Sintra at your own pace with a dedicated professional guide and private vehicle. 
              Perfect for families, couples, and anyone seeking a personalized adventure.
            </p>
            
            <div className="mb-10 flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
                <span className="text-sm text-white">Up to 8 guests</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-sm text-white">Flexible duration</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-white" />
                <span className="text-sm text-white">Custom itinerary</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
                onClick={() => onNavigate("live-chat")}
              >
                Request a Quote
                <MessageCircle className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                onClick={() => {
                  const element = document.getElementById("packages");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Packages
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section id="packages" className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">Private Tour Packages</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Choose the package that best fits your needs, or let us create a custom itinerary just for you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Half Day Tour */}
            <Card className="relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">Half Day Highlights</h3>
                  <p className="text-muted-foreground">Perfect introduction to Sintra's wonders</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-primary">€200</span>
                    <span className="text-muted-foreground">for up to 4 people</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">4 hours • +€50 per extra person</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">2-3 major attractions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Professional guide</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Private vehicle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Hotel pickup & drop-off</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Bottled water included</span>
                  </li>
                </ul>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => onNavigate("live-chat")}
                >
                  Book This Tour
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Full Day Tour - Popular */}
            <Card className="relative overflow-hidden border-2 border-accent shadow-xl">
              <div className="absolute right-4 top-4">
                <Badge className="bg-accent">Most Popular</Badge>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">Full Day Experience</h3>
                  <p className="text-muted-foreground">Comprehensive tour of Sintra's treasures</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-accent">€350</span>
                    <span className="text-muted-foreground">for up to 4 people</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">8 hours • +€75 per extra person</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">4-5 major attractions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">Expert local guide</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">Premium vehicle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">Hotel pickup & drop-off</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">Lunch recommendations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">Photo stops at hidden viewpoints</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => onNavigate("live-chat")}
                >
                  Book This Tour
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Custom Tour */}
            <Card className="relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">Custom Experience</h3>
                  <p className="text-muted-foreground">Tailored entirely to your preferences</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-primary">Custom</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Flexible duration • Your choice</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Personalized itinerary</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Duration of your choice</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Specialized themes available</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Multi-day tours possible</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">Special occasions welcome</span>
                  </li>
                </ul>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => onNavigate("live-chat")}
                >
                  Contact Us
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              * Attraction entrance fees not included • All prices in EUR • Group discounts available for 8+ people
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Private Tours - Compact */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-foreground">Why Choose a Private Tour?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              While our hop-on/hop-off service is perfect for independent explorers, 
              a private tour offers an unmatched personalized experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Heart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">Your Own Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Spend as much time as you want at each attraction
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">Expert Local Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Insider knowledge and personalized recommendations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">Custom Itinerary</h3>
                <p className="text-sm text-muted-foreground">
                  Visit the places that interest you most
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">What's Included in Every Tour</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">Expert Guide</h3>
              <p className="text-sm text-muted-foreground">
                Licensed professional with deep local knowledge
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">Private Vehicle</h3>
              <p className="text-sm text-muted-foreground">
                Clean, air-conditioned, and comfortable
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">Hotel Pickup</h3>
              <p className="text-sm text-muted-foreground">
                Convenient pickup from anywhere in Sintra
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">Insurance</h3>
              <p className="text-sm text-muted-foreground">
                Fully insured vehicles and professional drivers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Itineraries */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">Sample Itineraries</h2>
            <p className="text-lg text-muted-foreground">
              Get inspired by our most popular routes (fully customizable)
            </p>
          </div>

          <div className="space-y-6">
            {/* Half Day Sample */}
            <Card className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1">Half Day: Royal Palaces</h3>
                  <p className="text-sm text-muted-foreground">4 hours • Perfect for first-time visitors</p>
                </div>
                <Badge variant="outline">Popular</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">1</div>
                  <div>
                    <p className="text-sm">Pena Palace (90 min)</p>
                    <p className="text-xs text-muted-foreground">Sintra's most iconic landmark</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">2</div>
                  <div>
                    <p className="text-sm">Sintra Historic Center (45 min)</p>
                    <p className="text-xs text-muted-foreground">Charming streets and local pastries</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">3</div>
                  <div>
                    <p className="text-sm">Quinta da Regaleira (60 min)</p>
                    <p className="text-xs text-muted-foreground">Mystical gardens and initiation well</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Full Day Sample */}
            <Card className="border-2 border-accent/50 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1">Full Day: Complete Sintra</h3>
                  <p className="text-sm text-muted-foreground">8 hours • The ultimate Sintra experience</p>
                </div>
                <Badge className="bg-accent">Recommended</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">1</div>
                  <div>
                    <p className="text-sm">Pena Palace & Park (2 hours)</p>
                    <p className="text-xs text-muted-foreground">UNESCO World Heritage Site</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">2</div>
                  <div>
                    <p className="text-sm">Moorish Castle (45 min)</p>
                    <p className="text-xs text-muted-foreground">Stunning panoramic views</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">3</div>
                  <div>
                    <p className="text-sm">Lunch Break in Sintra (90 min)</p>
                    <p className="text-xs text-muted-foreground">Authentic Portuguese cuisine recommendations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">4</div>
                  <div>
                    <p className="text-sm">Quinta da Regaleira (90 min)</p>
                    <p className="text-xs text-muted-foreground">Explore mystical gardens and tunnels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">5</div>
                  <div>
                    <p className="text-sm">Cabo da Roca (30 min)</p>
                    <p className="text-xs text-muted-foreground">Westernmost point of continental Europe</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">What Our Guests Say</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                "Our guide Manuel was incredible! He took us to spots we never would have found on our own. 
                The private tour was worth every euro."
              </p>
              <div>
                <p className="text-sm">Sarah & John</p>
                <p className="text-xs text-muted-foreground">United Kingdom • September 2024</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                "Perfect for our family with young kids. We could go at our own pace and the guide was 
                so patient and knowledgeable."
              </p>
              <div>
                <p className="text-sm">The Martinez Family</p>
                <p className="text-xs text-muted-foreground">Spain • October 2024</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                "Celebrating our anniversary with a private tour was the best decision. Romantic, 
                personalized, and absolutely unforgettable."
              </p>
              <div>
                <p className="text-sm">Emma & Luca</p>
                <p className="text-xs text-muted-foreground">Italy • August 2024</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="mb-2">How do I book a private tour?</h3>
              <p className="text-sm text-muted-foreground">
                Contact us via live chat or WhatsApp to discuss your preferences. We'll create a custom 
                quote and confirm your booking with a deposit.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">What languages are available?</h3>
              <p className="text-sm text-muted-foreground">
                Our guides speak English, Portuguese, Spanish, French, German, Italian, and Dutch. 
                Let us know your preference when booking.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">Are entrance fees included?</h3>
              <p className="text-sm text-muted-foreground">
                Entrance fees to attractions are not included in the tour price. Your guide will 
                help you purchase tickets and can often skip-the-line.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">What's your cancellation policy?</h3>
              <p className="text-sm text-muted-foreground">
                Free cancellation up to 48 hours before the tour. Within 48 hours, a 50% fee applies. 
                No refunds for same-day cancellations.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">Can you accommodate special needs?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! We have wheelchair-accessible vehicles and can adapt itineraries for mobility 
                issues, dietary requirements, or any special needs. Just let us know in advance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-white">Ready for Your Private Sintra Experience?</h2>
          <p className="mb-8 text-lg text-white/90">
            Let us create the perfect personalized tour for you and your loved ones.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
              onClick={() => onNavigate("live-chat")}
            >
              Get Your Free Quote
              <MessageCircle className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
              onClick={() => onNavigate("buy-ticket")}
            >
              Or Try Our Day Pass
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
