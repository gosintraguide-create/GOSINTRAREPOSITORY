import { useState, useEffect } from "react";
import { Sunset, Clock, Users, MapPin, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SunsetSpecialCarouselProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function SunsetSpecialCarousel({ onNavigate, language = "en" }: SunsetSpecialCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [timeUntilAvailable, setTimeUntilAvailable] = useState("");

  // Configuration - set this to control when tickets become available
  const AVAILABILITY_HOUR = 14; // 2 PM - tickets become available at this hour
  const LIMITED_SEATS = 8;

  const carouselImages = [
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
  ];

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check availability based on time
  useEffect(() => {
    const checkAvailability = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= AVAILABILITY_HOUR) {
        setIsAvailable(true);
        setTimeUntilAvailable("");
      } else {
        setIsAvailable(false);
        const hoursUntil = AVAILABILITY_HOUR - currentHour;
        const minutesUntil = 60 - now.getMinutes();
        
        if (hoursUntil === 1 && minutesUntil < 60) {
          setTimeUntilAvailable(`Available in ${minutesUntil} minutes`);
        } else if (hoursUntil > 1) {
          setTimeUntilAvailable(`Available at ${AVAILABILITY_HOUR}:00`);
        } else {
          setTimeUntilAvailable(`Available soon`);
        }
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleBookClick = () => {
    if (isAvailable) {
      onNavigate("buy-ticket");
      // You can add a URL parameter to pre-select this special activity
      // For example: onNavigate("buy-ticket?special=sunset-cabo-roca");
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 shadow-2xl">
        {/* Special Badge */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 shadow-lg">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm text-white">Today's Special</span>
        </div>

        {/* Carousel Container */}
        <div className="relative h-64 overflow-hidden sm:h-80 lg:h-96">
          {/* Images */}
          {carouselImages.map((image, index) => (
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Sunset className="h-6 w-6 text-orange-400" />
                  <h3 className="text-2xl text-white sm:text-3xl">
                    Sunset Drive to Cabo da Roca
                  </h3>
                </div>
                <p className="mb-4 max-w-2xl text-base text-white/90 sm:text-lg">
                  Experience the breathtaking sunset at Europe's westernmost point. 
                  Join our exclusive evening journey with a professional guide.
                </p>

                {/* Activity Details */}
                <div className="mb-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">6:00 PM Departure</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                    <MapPin className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">2-Hour Experience</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                    <Users className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">Only {LIMITED_SEATS} Seats</span>
                  </div>
                </div>

                {/* Availability Status */}
                {!isAvailable && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/90 px-4 py-2 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm text-white">{timeUntilAvailable}</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleBookClick}
                  disabled={!isAvailable}
                  className={`group relative overflow-hidden ${
                    isAvailable
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      : "bg-gray-500 cursor-not-allowed"
                  } px-6 py-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">
                      {isAvailable ? "Book Now" : "Coming Soon"}
                    </span>
                    {isAvailable && (
                      <span className="text-xs opacity-90">Limited availability</span>
                    )}
                  </div>
                  {isAvailable && (
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
