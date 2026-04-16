import { Ticket, MapPin, RefreshCw, Star, CheckCircle, Clock, CreditCard, Car, Users, Zap, Heart, Camera, Bell, AlertCircle } from "lucide-react";
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
      title: "Book in Seconds!",
      description:
        "Pick your date, add optional attractions, and boom—you're all set! Your digital pass arrives instantly via email. No printing, no hassle, just pure adventure.",
      highlight: "⚡ Takes less than 3 minutes",
    },
    {
      number: 2,
      icon: MapPin,
      title: "Get Your Magic QR Code",
      description:
        "Your smartphone becomes your ticket to Sintra! Save your QR code and you're ready to hop on at any of our stops. It's that simple.",
      highlight: "📱 Works offline too!",
    },
    {
      number: 3,
      icon: Car,
      title: "Hop On & Explore!",
      description:
        "See a tuk tuk at the stop? Flash your code to your professional driver-guide and jump in! With rides every 10-15 minutes from 9am to 8pm, you'll never wait long. Explore at your own pace—our guides have you covered all day long.",
      highlight: "🎉 Unlimited rides with professional guides",
    },
    {
      number: 4,
      icon: Bell,
      title: "No Vehicle at the Stop?",
      description:
        "If you don't see any vehicles waiting when you arrive at a stop, you can request a pickup! This lets us know you're waiting and helps us get to you faster. Your request helps us optimize our service and reduce wait times for everyone.",
      highlight: "🔔 Request pickup anytime",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Intimate Adventures",
      description: "Just 2-6 guests per vehicle means you'll actually enjoy the ride! No tour bus crowds, just cozy exploration.",
      color: "from-accent to-accent/80",
      image: "https://images.unsplash.com/photo-1670261197503-e7745a85707c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGNpdGVkJTIwdG91cmlzdHMlMjBleHBsb3Jpbmd8ZW58MXx8fHwxNzYwODI0MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      icon: Car,
      title: "Professional Driver-Guides",
      description: "Every tuk tuk, vintage jeep, and van is driven by a certified local guide who knows Sintra inside out. Get insights you won't find in any guidebook!",
      color: "from-primary to-primary/80",
      image: "https://images.unsplash.com/photo-1669908753503-78024f9ddfe9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0dWdhbCUyMHR1ayUyMHR1ayUyMGFkdmVudHVyZXxlbnwxfHx8fDE3NjA4MjQyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      icon: Camera,
      title: "Your Time, Your Way",
      description: "Spotted something Instagram-worthy? Hop off! Take your time, snap those photos, and catch the next ride when you're ready.",
      color: "from-accent to-accent/80",
      image: "https://images.unsplash.com/photo-1697394494123-c6c1323a14f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      icon: Clock,
      title: "Never Rush Again",
      description: "Vehicles pass every 10-15 minutes all day long (9am-8pm). Missed one? No worries, another's coming soon!",
      color: "from-primary to-primary/80",
      image: "https://images.unsplash.com/photo-1576053437997-efe2472c87ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBjYXN0bGUlMjBhZXJpYWwlMjB2aWV3fGVufDF8fHx8MTc2MDgyNDI0M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      icon: Heart,
      title: "Guaranteed Seats",
      description: "Unlike public transport, your seat is waiting for you. Pre-booked, stress-free, comfortable—the way travel should be!",
      color: "from-accent to-accent/80",
      image: "https://images.unsplash.com/photo-1673515335086-c762bbd7a7cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHRyYXZlbGVyJTIwcGhvbmUlMjBib29raW5nfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      icon: Zap,
      title: "Instant Everything",
      description: "Book now, ride now! Digital tickets mean no waiting in lines. Just point, scan, and you're on your way to adventure.",
      color: "from-primary to-primary/80",
      image: "https://images.unsplash.com/photo-1697394494123-c6c1323a14f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  return (
    <div className="flex-1">
      {/* Hero Section - More Dynamic */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 animate-pulse rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 animate-pulse rounded-full bg-accent/30 blur-3xl" style={{ animationDelay: "1s" }} />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          {/* Fun Badge */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl">
              <Zap className="h-10 w-10 text-accent" />
            </div>
          </div>
          
          {/* Catchy Heading */}
          <h1 className="mb-4 text-white drop-shadow-lg">
            Your Sintra Adventure<br />Made Ridiculously Easy
          </h1>
          
          {/* Engaging Description */}
          <p className="mx-auto max-w-2xl text-xl text-white/95 drop-shadow-md">
            Three simple steps to the best day of your trip! 🎉
          </p>
          
          {/* Fun Stats Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-lg">
              <Zap className="h-5 w-5 text-accent" />
              <span className="text-foreground">Super Fast Booking</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-lg">
              <Heart className="h-5 w-5 text-accent" />
              <span className="text-foreground">100% Flexible</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-lg">
              <RefreshCw className="h-5 w-5 text-accent" />
              <span className="text-foreground">Unlimited Rides</span>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section - More Playful */}
      <section className="relative bg-gradient-to-b from-white via-secondary/20 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-accent">Easy as 1-2-3</span>
            </div>
            <h2 className="text-foreground">How It Works</h2>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group relative"
              >
                {/* Connector Line - More Colorful */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 hidden h-full w-1 bg-gradient-to-b from-accent via-primary to-accent opacity-20 md:block" />
                )}

                <Card className="relative overflow-hidden border-2 border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                  <div className="flex flex-col gap-6 p-8 md:flex-row md:items-start">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg">
                        <span className="text-2xl text-white">{step.number}</span>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <step.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 text-foreground">{step.title}</h3>
                          <p className="text-muted-foreground">{step.description}</p>
                          {/* Highlight callout */}
                          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-sm text-accent">
                            <CheckCircle className="h-4 w-4" />
                            {step.highlight}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-accent/5 to-transparent" />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - More Dynamic */}
      <section className="border-y border-border bg-gradient-to-br from-secondary/30 via-white to-primary/5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-primary">Why You'll Love It</span>
            </div>
            <h2 className="mb-4 text-foreground">What Makes Us Different</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              This isn't just transportation—it's part of the adventure! ✨
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                  <ImageWithFallback
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
                </div>
                
                <div className="relative p-6">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover effect border */}
                <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - More Exciting */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-accent py-20 sm:py-28">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-10 h-32 w-32 animate-bounce rounded-full bg-white/30 blur-2xl" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-10 right-1/4 h-40 w-40 animate-bounce rounded-full bg-white/30 blur-2xl" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
              <Ticket className="h-10 w-10 text-accent" />
            </div>
          </div>
          
          <h2 className="mb-4 text-white drop-shadow-lg">
            Ready for the Best Day Ever?
          </h2>
          <p className="mb-8 text-xl text-white/95 drop-shadow-md">
            Book your full day pass now—adventure awaits! 🚗✨
          </p>
          
          <Button
            size="lg"
            className="bg-white text-primary shadow-2xl transition-all hover:scale-105 hover:bg-white/90 hover:shadow-accent/50"
            onClick={() => onNavigate("buy-ticket")}
          >
            <Ticket className="mr-2 h-5 w-5" />
            Get Your Day Pass Now
            <RefreshCw className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="mt-4 text-sm text-white/80">
            ⚡ Instant confirmation • 📱 Mobile-friendly • 💳 Secure payment
          </p>
        </div>
      </section>
    </div>
  );
}
