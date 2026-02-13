import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
// Force rebuild - all fields required - Build 2025-02-10
import {
  ArrowRight,
  Check,
  Users,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  Rocket,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { featureFlags } from "../lib/featureFlags";
import { getTranslation, getUITranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// Force rebuild - search bar removed

// Private Tours Page - Updated to fix module loading
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

export function PrivateToursPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  
  const content = getTranslation(language);
  const t = content.privateTours;
  const uiT = getUITranslation(language);

  const [tours, setTours] = useState<PrivateTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<PrivateTour | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    numberOfPeople: "",
    preferredDate: undefined as Date | undefined,
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Check if Private Tours feature is enabled
  const getFeatureFlag = () => {
    try {
      const flags = localStorage.getItem("feature-flags");
      if (flags) {
        const parsed = JSON.parse(flags);
        return parsed.privateToursEnabled === true;
      }
    } catch (e) {
      console.error("Failed to parse feature flags:", e);
    }
    return featureFlags.privateToursEnabled;
  };

  useEffect(() => {
    if (getFeatureFlag()) {
      loadTours();
    }
  }, []);

  const loadTours = async () => {
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
        // Only show published tours
        const publishedTours = (data.tours || []).filter((tour: PrivateTour) => tour.published);
        setTours(publishedTours);
      }
    } catch (error) {
      console.error("Error loading tours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTour = (tour: PrivateTour) => {
    setSelectedTour(tour);
    setShowRequestDialog(true);
  };

  const submitTourRequest = async () => {
    if (!selectedTour) return;

    // Validation
    if (!formData.customerName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tourTitle: selectedTour.title,
            customerName: formData.customerName,
            email: formData.email,
            phone: formData.phone,
            preferredDate: formData.preferredDate?.toISOString(),
            numberOfPeople: formData.numberOfPeople ? parseInt(formData.numberOfPeople) : undefined,
            message: formData.message,
          }),
        }
      );

      if (response.ok) {
        toast.success("Request submitted! We'll contact you soon.");
        setShowRequestDialog(false);
        setFormData({
          customerName: "",
          email: "",
          phone: "",
          numberOfPeople: "",
          preferredDate: undefined,
          message: "",
        });
        setSelectedTour(null);
      } else {
        toast.error("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting tour request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!getFeatureFlag()) {
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
              <span className="text-white">{t.comingSoon.badge}</span>
            </div>

            <h1 className="mb-6 text-white">{t.comingSoon.title}</h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90 sm:text-2xl">
              {t.comingSoon.subtitle}
            </p>

            <div className="mb-12 space-y-4">
              <p className="text-lg text-white/80">{t.comingSoon.stayTunedText}</p>
              <div className="mx-auto max-w-2xl space-y-3">
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature1}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature2}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature3}</span>
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
                {t.comingSoon.notifyButton}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                onClick={() => onNavigate("buy-ticket")}
              >
                {t.comingSoon.exploreDayPassButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-white/70">{t.comingSoon.footerText}</p>
          </div>
        </section>
      </div>
    );
  }

  // Full Private Tours Page (when enabled) - Redesigned to match Attractions page
  return (
    <div className="flex-1">
      {/* Header Section - Clean, minimal like Attractions page */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-3 text-foreground">
              {t.hero?.title || "Private Tours in Sintra"}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t.hero?.subtitle || "Experience Sintra's magic with a personalized private tour tailored to your preferences"}
            </p>
          </div>
        </div>
      </section>

      {/* Tours Grid - Similar to Attractions grid */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading private tours...</p>
            </div>
          ) : tours.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                No tour packages available
              </p>
              <p className="text-muted-foreground mb-4">
                Contact us for custom private tour options tailored to your needs
              </p>
              <Button onClick={() => onNavigate("live-chat")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <Card
                  key={tour.id}
                  className="group h-full cursor-pointer overflow-hidden border bg-white shadow-md transition-all hover:shadow-xl"
                  onClick={() => onNavigate("private-tour-detail", { tourId: tour.id })}
                >
                  {/* Hero Image - Like Attractions page */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ImageWithFallback
                      src={tour.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop"}
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Badge on image */}
                    {tour.badge && (
                      <div className="absolute right-4 top-4">
                        <Badge
                          className={
                            tour.badgeColor === "accent" 
                              ? "bg-accent text-white" 
                              : "bg-primary text-white"
                          }
                        >
                          {tour.badge}
                        </Badge>
                      </div>
                    )}

                    {/* Title on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white">
                        {tour.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {tour.description}
                    </p>

                    {/* Tour Info */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{tour.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-foreground">{tour.price}</span>
                        {tour.priceSubtext && (
                          <span className="text-muted-foreground">
                            {tour.priceSubtext}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-end gap-2 border-t border-border pt-3 text-sm text-primary">
                      <span className="font-medium">View Details</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tours.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t.packages?.disclaimer || "All prices are subject to availability. Custom itineraries available upon request."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Info Section - Like Attractions page */}
      <section className="border-t border-border bg-secondary/20 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-foreground">
            Need a Custom Experience?
          </h2>
          <p className="mb-6 text-muted-foreground">
            Contact us to create a personalized private tour tailored to your interests, schedule, and group size.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate("live-chat")}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat With Us
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate("buy-ticket")}
            >
              Explore Day Pass
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Tour Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request a Private Tour</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll get back to you shortly with a personalized quote.
            </DialogDescription>
          </DialogHeader>

          {selectedTour && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-sm font-medium text-muted-foreground">Selected Tour</p>
                <p className="text-lg font-semibold text-foreground">{selectedTour.title}</p>
                <p className="text-sm text-muted-foreground">{selectedTour.price} • {selectedTour.duration}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+351 123 456 789"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="people">Number of People *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="people"
                      type="number"
                      min="1"
                      value={formData.numberOfPeople}
                      onChange={(e) =>
                        setFormData({ ...formData, numberOfPeople: e.target.value })
                      }
                      placeholder="2"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label>Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredDate
                          ? formData.preferredDate.toLocaleDateString()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, preferredDate: date })
                        }
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="message">Additional Information *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Any special requirements or questions?"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={submitTourRequest}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRequestDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}