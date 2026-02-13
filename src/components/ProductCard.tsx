import { useState } from "react";
import { Check, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getComponentTranslation } from "../lib/translations/components";

interface ProductCardProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  language?: string;
  productType?: "daypass" | "insight-tour" | "monuments";
  customImages?: Array<{ src: string; alt: string }>;
  customContent?: {
    title?: string;
    description?: string;
    features?: string[];
    buttonText?: string;
  };
}

export function ProductCard({ onNavigate, basePrice, language = "en", productType = "daypass", customImages, customContent }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const isPriceLoaded = basePrice > 0;
  const t = getComponentTranslation(language);

  const defaultProductImages = {
    daypass: [
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Colorful Pena Palace in Sintra",
      },
      {
        src: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=500&fit=crop",
        alt: "Tuk Tuk exploring Sintra",
      },
      {
        src: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=500&fit=crop",
        alt: "Quinta da Regaleira",
      },
      {
        src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop",
        alt: "Sintra Mountains view",
      },
    ],
    "insight-tour": [
      {
        src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=500&fit=crop",
        alt: "Professional tour guide",
      },
      {
        src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
        alt: "Guided tour experience",
      },
      {
        src: "https://images.unsplash.com/photo-1523874134873-4cd054343be4?w=800&h=500&fit=crop",
        alt: "Historical storytelling",
      },
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Pena Palace tour",
      },
    ],
    monuments: [
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Pena Palace",
      },
      {
        src: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=500&fit=crop",
        alt: "Quinta da Regaleira",
      },
      {
        src: "https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800&h=500&fit=crop",
        alt: "Moorish Castle",
      },
      {
        src: "https://images.unsplash.com/photo-1555881490-a0b9f8f4b6b5?w=800&h=500&fit=crop",
        alt: "Monserrate Palace",
      },
    ],
  };

  const images = customImages || defaultProductImages[productType];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Map product type to translation key
  const productTypeMap = {
    "daypass": "daypass",
    "insight-tour": "insightTour",
    "monuments": "monuments",
  } as const;
  
  const translationKey = productTypeMap[productType];
  const defaultContent = t.productCard[translationKey];
  
  const content = customContent ? {
    title: customContent.title || defaultContent.title,
    description: customContent.description || defaultContent.description,
    features: customContent.features || defaultContent.features,
    bookNow: customContent.buttonText || defaultContent.bookNow,
  } : defaultContent;

  return (
    <Card className="w-full bg-white shadow-xl border-0 overflow-hidden group flex flex-col h-full gap-0">
      {/* Image Carousel */}
      <div 
        className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer select-none flex-shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex h-full transition-transform duration-500 ease-out w-full"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0 w-full">
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-gray-800" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Next image"
        >
          <ChevronRight className="h-3.5 w-3.5 text-gray-800" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentImageIndex
                  ? "bg-white w-5"
                  : "bg-white/60 w-1.5 hover:bg-white/80"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 px-5 py-3">
        <h4 className="text-white mb-0.5">{content.title}</h4>
        <p className="text-white/90 text-xs">{content.description}</p>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Features List */}
        <div className="space-y-2 flex-1">
          {content.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent" />
                </div>
              </div>
              <span className="text-xs text-foreground leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="border-t border-border pt-3 mt-4">
          {isPriceLoaded ? (
            <div className="flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-primary">€{basePrice}</span>
              <span className="text-xs text-muted-foreground ml-2">per pass</span>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-3">
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
          )}

          {/* Learn More Link - Only for daypass */}
          {productType === "daypass" && (
            <Button
              onClick={() => onNavigate("hop-on-service")}
              className="h-11 w-full bg-accent text-white hover:bg-accent/90 shadow-md text-sm mb-2"
              size="lg"
            >
              Learn more about the service
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Book Now Button */}
          <Button
            onClick={() => onNavigate("buy-ticket")}
            variant="outline"
            className="h-10 w-full text-sm border-primary text-primary hover:bg-primary/5"
            size="default"
          >
            {content.bookNow}
          </Button>
        </div>
      </div>
    </Card>
  );
}