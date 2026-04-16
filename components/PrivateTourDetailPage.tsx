import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TourBookingDialog } from "./TourBookingDialog";
import {
  ArrowLeft,
  Users,
  Clock,
  Check,
  Euro,
  MapPin,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface PrivateTour {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  duration: string;
  price: string;
  priceSubtext?: string;
  features: string[];
  badge?: string;
  badgeColor?: "primary" | "accent";
  buttonText: string;
  buttonVariant?: "default" | "outline";
  published: boolean;
  order: number;
  heroImage?: string;
}

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function PrivateTourDetailPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const { slug } = useParams<{ slug: string }>();
  
  const [tour, setTour] = useState<PrivateTour | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    loadTour();
  }, [slug]);

  const loadTour = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tours: PrivateTour[] = data.tours || [];
        const foundTour = tours.find((t) => t.id === slug);
        setTour(foundTour || null);
      }
    } catch (error) {
      console.error("Error loading tour:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading tour details...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-2xl font-bold">Tour not found</div>
        <Button onClick={() => onNavigate("private-tours")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Private Tours
        </Button>
      </div>
    );
  }

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
          src={tour.heroImage || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920"}
          alt={tour.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-12 md:pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-4 flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                  {tour.title}
                </h1>
                {tour.badge && (
                  <Badge
                    variant={tour.badgeColor === "accent" ? "default" : "secondary"}
                    className={
                      tour.badgeColor === "accent" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    }
                  >
                    {tour.badge}
                  </Badge>
                )}
              </div>
              <p className="max-w-2xl text-lg text-white/90 sm:text-xl">
                {tour.description}
              </p>
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
              {/* Long Description */}
              {tour.longDescription && (
                <div className="mb-8">
                  <h2 className="mb-4 text-3xl font-bold">About This Tour</h2>
                  <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
                    {tour.longDescription}
                  </p>
                </div>
              )}

              {/* Tour Highlights */}
              <h2 className="mb-6 text-3xl font-bold">Tour Features</h2>
              <div className="space-y-4">
                {tour.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6">
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="font-semibold">{tour.duration}</span>
                  </div>
                </div>
                
                <div className="mb-6 text-center">
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="text-3xl font-bold">{tour.price}</div>
                  {tour.priceSubtext && (
                    <div className="text-sm text-muted-foreground">{tour.priceSubtext}</div>
                  )}
                </div>
                
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setShowBookingDialog(true)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book This Tour
                </Button>
                
                
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Booking Dialog */}
      {tour && (
        <TourBookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          tour={{
            id: tour.id,
            title: tour.title,
            price: tour.price,
          }}
        />
      )}
    </div>
  );
}