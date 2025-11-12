import { Clock, MapPin, ArrowLeft, Star, Check, Lightbulb, ChevronRight, Calendar, Ticket, ShoppingCart, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { loadComprehensiveContent, type ComprehensiveContent, DEFAULT_COMPREHENSIVE_CONTENT } from "../lib/comprehensiveContent";
import { motion } from "motion/react";

interface AttractionDetailPageProps {
  onNavigate: (page: string) => void;
  attractionId: string;
}

export function AttractionDetailPage({ onNavigate, attractionId }: AttractionDetailPageProps) {
  const [content, setContent] = useState<ComprehensiveContent>(DEFAULT_COMPREHENSIVE_CONTENT);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");

  // Fallback images for attractions without uploaded images
  const attractionFallbackImages: { [key: string]: string } = {
    "pena-palace": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5hJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwMnww&ixlib=rb-4.1.0&q=80&w=1080",
    "quinta-regaleira": "https://images.unsplash.com/photo-1643208143695-3c79c2f36cce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWludGElMjByZWdhbGVpcmElMjBzaW50cmF8ZW58MXx8fHwxNzYwMTQwNjAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "moorish-castle": "https://images.unsplash.com/photo-1555881674-7d4f8e8867e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29yaXNoJTIwY2FzdGxlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "monserrate-palace": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zZXJyYXRlJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "sintra-palace": "https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHNpbnRyYSUyMHBvcnR1Z2FsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDE0MDIwMHww&ixlib=rb-4.1.0&q=80&w=1080",
  };

  useEffect(() => {
    setContent(loadComprehensiveContent());
  }, []);

  const attraction = content.attractions.attractionDetails[attractionId];

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
      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("attractions")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Attractions
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src={attraction.heroImage || attractionFallbackImages[attractionId] || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920&h=1080&fit=crop"}
          alt={attraction.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-12 sm:pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                className="mb-4 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="text-white">€{getCurrentPrice()}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="text-white">{attraction.duration}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white">Must-See!</span>
                </div>
              </motion.div>

              <motion.h1
                className="mb-4 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {attraction.name}
              </motion.h1>

              <motion.p
                className="max-w-3xl text-xl text-white/90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {attraction.shortDescription}
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Information */}
            <div className="space-y-8 lg:col-span-2">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-4">About This Gem</Badge>
                <h2 className="mb-4 text-foreground">What Makes It Special</h2>
                <p className="text-lg text-muted-foreground">
                  {attraction.longDescription}
                </p>
              </motion.div>

              {/* Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="mb-4">Highlights</Badge>
                <h3 className="mb-4 text-foreground">Don't Miss These!</h3>
                <div className="grid gap-3">
                  {attraction.highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border bg-white p-4 transition-all hover:shadow-lg"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-foreground">{highlight}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Visitor Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-4">Pro Tips</Badge>
                <h3 className="mb-4 text-foreground">Insider Advice</h3>
                <div className="grid gap-3">
                  {attraction.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      className="rounded-xl border bg-secondary/30 p-4 transition-all hover:shadow-lg"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                        <p className="text-foreground">{tip}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Practical Information */}
              <motion.div
                className="grid gap-6 sm:grid-cols-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 transition-all hover:shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-foreground">Opening Hours</h4>
                  </div>
                  <p className="text-muted-foreground">{attraction.hours}</p>
                </Card>

                <Card className="p-6 transition-all hover:shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Camera className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="text-foreground">Time Needed</h4>
                  </div>
                  <p className="text-muted-foreground">{attraction.duration}</p>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Ticket Info Card */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="sticky top-24 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-foreground">Ticket Information</h3>
                </div>

                <div className="mb-6 rounded-xl bg-secondary/30 p-6 text-center">
                  <div className="mb-2 text-sm text-muted-foreground">Entrance Ticket</div>
                  <div className="mb-4 text-3xl text-foreground">
                    €{attraction.parkOnlyPrice ? attraction.parkOnlyPrice : attraction.price}
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    Online Booking Coming Soon
                  </Badge>
                </div>

                <div className="mb-6 space-y-2 rounded-xl bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    Attraction tickets are not yet available for online purchase. You can buy tickets at the entrance.
                  </p>
                </div>

                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-foreground">
                    💡 Get There Easily!
                  </h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Book a Hop On Sintra day pass for unlimited transport between all attractions with professional driver-guides!
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => onNavigate("buy-ticket")}
                  >
                    Get Day Pass
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}