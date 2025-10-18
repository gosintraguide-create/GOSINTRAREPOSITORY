import { Ticket, MapPin, RefreshCw, Star, CheckCircle, Clock, CreditCard, Car, Users } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card } from "./ui/card";

interface HowItWorksPageProps {
  onNavigate: (page: string) => void;
}

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  const steps = [
    {
      number: 1,
      icon: Ticket,
      title: "Book Your Day Pass",
      description:
        "Purchase your full day pass in minutes. Select your preferred date and optional guided commentary time. Instant confirmation sent to your email.",
    },
    {
      number: 2,
      icon: MapPin,
      title: "Receive Your Ticket",
      description:
        "Get your unique QR code via email immediately after booking. Save it to your phone for easy access throughout your sightseeing adventure.",
    },
    {
      number: 3,
      icon: Car,
      title: "Start Your Adventure",
      description:
        "Show your QR code to board at any stop. With service every 10-15 minutes, you're always moments away from discovering Sintra's next treasure.",
    },
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        {/* Background Image - Top Half Only */}
        <div className="absolute left-0 right-0 top-0 h-[50vh]">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1751929043248-c9fd90b8bf00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjByb2FkJTIwZm9yZXN0JTIwdHJlZXN8ZW58MXx8fHwxNzYwMTgyNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Sintra scenic road"
            className="h-full w-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/50 to-background" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          {/* Icon Badge */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </div>
          
          {/* Heading */}
          <h1 className="mb-4 text-white drop-shadow-lg">
            How It Works
          </h1>
          
          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg text-white/95 drop-shadow-md">
            Three simple steps to start your Sintra sightseeing adventure
          </p>
          
          {/* Quick Stats Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-foreground">3 Easy Steps</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-foreground">Instant Booking</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-foreground">Hop-On/Hop-Off</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex flex-col items-start gap-8 md:flex-row"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 hidden h-full w-px bg-border md:block" />
                )}

                {/* Step Number */}
                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-primary bg-white">
                  <span className="text-primary">{step.number}</span>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-y border-border bg-gradient-to-br from-secondary/30 via-white to-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">What Makes Us Special</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Intimate sightseeing experiences designed for discovery and comfort
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-border shadow-md transition-all hover:shadow-xl">
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1715616130000-375a7e5fac95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGdyb3VwJTIwcGVvcGxlJTIwaGFwcHklMjB0cmF2ZWx8ZW58MXx8fHwxNzYwMTgyMjA1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Small group travel"
                  className="h-full w-full object-cover opacity-50 transition-all group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">Small Group Experience</h3>
                <p className="text-muted-foreground">
                  Experience Sintra in intimate groups of 2-6 guests. No crowded buses—just personalized sightseeing adventures.
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-border shadow-md transition-all hover:shadow-xl">
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1725862680305-1b12dc20b727?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdHVrJTIwdHVrJTIwcG9ydHVuYWx8ZW58MXx8fHwxNzYwMTgyMjA1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Vintage tuk tuk"
                  className="h-full w-full object-cover opacity-50 transition-all group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Car className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">Authentic Vehicles</h3>
                <p className="text-muted-foreground">
                  Explore in tuk tuks, UMM jeeps, or comfortable vans. Experience the real Sintra, not from a bus window.
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-border shadow-md transition-all hover:shadow-xl">
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1594256340121-539bdb42e72a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwYWxhY2UlMjBnYXJkZW4lMjBwYXRofGVufDF8fHx8MTc2MDE4MjIwNnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Sintra palace gardens"
                  className="h-full w-full object-cover opacity-50 transition-all group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">Total Flexibility</h3>
                <p className="text-muted-foreground">
                  Hop off at any attraction, explore as long as you want, then hop back on. Your experience, your pace.
                </p>
              </div>
            </Card>
            <Card className="group relative overflow-hidden border-border shadow-md transition-all hover:shadow-xl">
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1594256340121-539bdb42e72a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwYWxhY2UlMjBnYXJkZW4lMjBwYXRofGVufDF8fHx8MTc2MDE4MjIwNnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Sintra palace gardens"
                  className="h-full w-full object-cover opacity-50 transition-all group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/60" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-foreground">What are the operating hours?</h3>
                <p className="text-muted-foreground">
                  Our service operates daily from 9:00 AM to 8:00 PM. The last pickup time varies by attraction,
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-foreground">Ready to Explore Sintra?</h2>
          <p className="mb-8 text-muted-foreground">
            Book your full day pass now and start your adventure
          </p>
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            Book Your Day Pass
            <RefreshCw className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}