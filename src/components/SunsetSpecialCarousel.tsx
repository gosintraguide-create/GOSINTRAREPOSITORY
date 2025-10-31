import { useState, useEffect } from "react";
import { Sunset, Clock, Users, MapPin, Sparkles, ChevronLeft, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

interface SunsetSpecialCarouselProps {
  onNavigate: (page: string) => void;
  language?: string;
}

interface SunsetSpecialSettings {
  enabled: boolean;
  title: string;
  description: string;
  departureTime: string;
  duration: string;
  limitedSeats: number;
  availabilityHour: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
}

const DEFAULT_SETTINGS: SunsetSpecialSettings = {
  enabled: true,
  title: "Sunset Drive to Cabo da Roca",
  description: "Experience the breathtaking sunset at Europe's westernmost point with a professional guide.",
  departureTime: "6:00 PM",
  duration: "2 Hours",
  limitedSeats: 8,
  availabilityHour: 14,
  images: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      alt: "Sunset at Cabo da Roca"
    },
    {
      url: "https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=1200&q=80",
      alt: "Westernmost point of Europe"
    },
    {
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
      alt: "Golden hour coastal views"
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80",
      alt: "Breathtaking Atlantic sunset"
    }
  ]
};

export function SunsetSpecialCarousel({ onNavigate, language = "en" }: SunsetSpecialCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [timeUntilAvailable, setTimeUntilAvailable] = useState("");
  const [settings, setSettings] = useState<SunsetSpecialSettings>(DEFAULT_SETTINGS);
  
  // Booking ID verification state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem("sunset-special-settings");
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error("Failed to parse sunset special settings:", e);
        }
      }
    };

    loadSettings();

    // Listen for storage events to update when admin changes settings
    const handleStorageChange = () => {
      loadSettings();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % settings.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [settings.images.length]);

  // Check availability based on time
  useEffect(() => {
    const checkAvailability = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= settings.availabilityHour) {
        setIsAvailable(true);
        setTimeUntilAvailable("");
      } else {
        setIsAvailable(false);
        const hoursUntil = settings.availabilityHour - currentHour;
        const minutesUntil = 60 - now.getMinutes();
        
        if (hoursUntil === 1 && minutesUntil < 60) {
          setTimeUntilAvailable(`Available in ${minutesUntil} minutes`);
        } else if (hoursUntil > 1) {
          setTimeUntilAvailable(`Available at ${settings.availabilityHour}:00`);
        } else {
          setTimeUntilAvailable(`Available soon`);
        }
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.availabilityHour]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % settings.images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + settings.images.length) % settings.images.length);
  };

  const handleBookClick = () => {
    if (isAvailable) {
      setShowBookingDialog(true);
      setBookingId("");
      setVerificationError("");
    }
  };

  const verifyBookingId = async () => {
    if (!bookingId.trim()) {
      setVerificationError("Please enter your booking ID");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    try {
      // Check if booking exists in the database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${encodeURIComponent(bookingId.trim())}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.booking) {
          // Valid booking found!
          toast.success("Booking verified! Redirecting...");
          setShowBookingDialog(false);
          
          // Store the verified booking ID for the sunset special purchase flow
          sessionStorage.setItem("sunset-special-booking-id", bookingId.trim());
          sessionStorage.setItem("sunset-special-active", "true");
          
          // Navigate to sunset special purchase page
          setTimeout(() => {
            onNavigate("sunset-special-purchase");
          }, 500);
        } else {
          setVerificationError("Booking ID not found. Please check and try again.");
        }
      } else {
        setVerificationError("Booking ID not found. Please check and try again.");
      }
    } catch (error) {
      console.error("Error verifying booking ID:", error);
      setVerificationError("Unable to verify booking ID. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      verifyBookingId();
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
      <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Carousel */}
          <div className="relative h-56 sm:h-64 lg:h-full lg:min-h-[280px] overflow-hidden">
            {/* Special Badge */}
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-xs text-white">Today's Special</span>
            </div>

            {/* Images */}
            {settings.images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <ImageWithFallback
                  src={image.url}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
              </div>
            ))}

            {/* Navigation Arrows - Desktop Only */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white hidden sm:block"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white hidden sm:block"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>

            {/* Carousel Indicators */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {settings.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-6 bg-white shadow-md"
                      : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex flex-col justify-between p-6 lg:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sunset className="h-5 w-5 text-orange-500" />
                <h3 className="text-xl sm:text-2xl text-gray-900">
                  {settings.title}
                </h3>
              </div>
              
              <p className="mb-4 text-sm text-gray-600 sm:text-base">
                {settings.description}
              </p>

              {/* Activity Details */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs text-gray-700">{settings.departureTime}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs text-gray-700">{settings.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5">
                  <Users className="h-3.5 w-3.5 text-orange-600" />
                  <span className="text-xs text-orange-700">Only {settings.limitedSeats} Seats</span>
                </div>
              </div>
            </div>

            {/* Bottom: Availability & CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
              {/* Availability Status */}
              {!isAvailable && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 border border-orange-200">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-700">{timeUntilAvailable}</span>
                </div>
              )}
              
              {isAvailable && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Available Now</span>
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleBookClick}
                disabled={!isAvailable}
                className={`${
                  isAvailable
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    : "bg-gray-400 cursor-not-allowed"
                } px-6 py-2.5 text-white shadow-md transition-all hover:shadow-lg disabled:hover:shadow-md`}
              >
                {isAvailable ? "Book This Experience" : "Coming Soon"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking ID Verification Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sunset className="h-5 w-5 text-orange-500" />
              Verify Your Booking
            </DialogTitle>
            <DialogDescription>
              This exclusive sunset experience is available only to existing Go Sintra customers. Please enter your booking ID to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="booking-id">Booking ID</Label>
              <Input
                id="booking-id"
                placeholder="e.g., GS-ABC123"
                value={bookingId}
                onChange={(e) => {
                  setBookingId(e.target.value);
                  setVerificationError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={isVerifying}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                You can find your booking ID in your confirmation email
              </p>
            </div>

            {verificationError && (
              <Alert variant="destructive">
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                disabled={isVerifying}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyBookingId}
                disabled={isVerifying || !bookingId.trim()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify & Continue
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-xs text-blue-900">
                <strong>Don't have a booking yet?</strong> You need to book a Go Sintra day pass first to access this exclusive experience.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBookingDialog(false);
                  onNavigate("home");
                }}
                className="w-full text-xs bg-white hover:bg-blue-50 border-blue-300"
              >
                Get a Day Pass
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
