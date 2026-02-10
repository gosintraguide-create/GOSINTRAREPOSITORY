import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  ArrowLeft,
  Clock,
  Users,
  Car,
  Star,
  Check,
  ChevronRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function PrivateTourDetailPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const { slug } = useParams<{ slug: string }>();

  // Placeholder data - in a real app this would come from your content management system
  const tour = {
    id: slug,
    name: "Private Tour",
    description: "Experience Sintra with a private guide tailored to your interests.",
    price: 200,
    duration: "4-8 hours",
    maxPassengers: 8,
    highlights: [
      "Personalized itinerary",
      "Expert local guide",
      "Flexible schedule",
      "Private vehicle",
    ],
    heroImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920",
  };

  return (
    <div className="flex-1">
      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("private-tours")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Private Tours
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <ImageWithFallback
          src={tour.heroImage}
          alt={tour.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-12 md:pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.h1
                className="mb-4 text-4xl font-bold text-white sm:text-5xl md:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {tour.name}
              </motion.h1>
              <motion.p
                className="max-w-2xl text-lg text-white/90 sm:text-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {tour.description}
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Details */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-3xl font-bold">Tour Highlights</h2>
              <div className="space-y-4">
                {tour.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-lg">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6">
                <div className="mb-6 text-center">
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="text-3xl font-bold">€{tour.price}</div>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onNavigate("live-chat")}
                >
                  Request Quote
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
