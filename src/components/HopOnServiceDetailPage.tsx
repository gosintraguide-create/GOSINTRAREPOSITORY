import {
  loadComprehensiveContentForLanguage,
  DEFAULT_COMPREHENSIVE_CONTENT,
  type ComprehensiveContent,
} from "../lib/comprehensiveContent";
import { useEditableContent } from "../lib/useEditableContent";

import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  ArrowLeft, 
  Ticket, 
  Clock, 
  MapPin,
  Users,
  Star, 
  Camera, 
  Check,
  ChevronRight,
  ChevronLeft,
  Bus,
  Shield,
  CalendarCheck,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import Slider from "react-slick";
import "../styles/slick-custom.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

// Custom arrow components for slider
const PrevArrow = (props: any) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <button
      {...restProps}
      className="slick-prev"
      aria-label="Previous slide"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
};

const NextArrow = (props: any) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <button
      {...restProps}
      className="slick-next"
      aria-label="Next slide"
    >
      <ChevronRight className="h-6 w-6" />
    </button>
  );
};

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function HopOnServiceDetailPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Use the hook that auto-updates when content changes
  const comprehensiveContent = useEditableContent(language);

  // Gallery images for the service
  const galleryImages = [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1668377298351-3f7a745a56fe?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1651520011190-6f37b5213684?w=1200&h=800&fit=crop"
  ];

  // Service features
  const features = [
    {
      icon: <Bus className="h-6 w-6" />,
      title: "Unlimited Rides",
      description: "Hop on and off as many times as you want throughout the day"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "9am to 7pm Service",
      description: "Full day access from morning to evening"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Guaranteed Seating",
      description: "Reserved seats in tuk-tuks and UMM jeeps"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "All Major Attractions",
      description: "Access to Pena Palace, Quinta da Regaleira, and more"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Professional Drivers",
      description: "Safe and comfortable transportation"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Skip the Wait",
      description: "No need to worry about parking or public transport schedules"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "How does the day pass work?",
      answer: "Your day pass gives you unlimited access to our hop-on/hop-off service from 9am to 7pm. Simply show your pass to board any of our vehicles at designated stops throughout Sintra. You can get on and off as many times as you like to explore the attractions at your own pace."
    },
    {
      question: "What vehicles do you use?",
      answer: "We operate a fleet of tuk-tuks and UMM jeeps, all equipped with comfortable seating. Our vehicles are perfect for navigating Sintra's narrow, winding roads and provide an authentic Portuguese experience."
    },
    {
      question: "Where can I board the service?",
      answer: "We have multiple pickup points throughout Sintra, including the train station, town center, and near major attractions. Check our route map for all stop locations and schedules."
    },
    {
      question: "Is the pass valid for multiple days?",
      answer: "Each pass is valid for one full day of service. If you need transportation for multiple days, you can purchase additional day passes at the time of booking or separately."
    },
    {
      question: "Can I bring luggage?",
      answer: "Small bags and backpacks are fine, but large luggage may not fit comfortably in our vehicles. If you have significant luggage, please contact us in advance to discuss your options."
    },
    {
      question: "Do you offer group discounts?",
      answer: "Yes! When booking multiple passes (for groups), you'll benefit from our group pricing. Children aged 7-12 also receive reduced pricing."
    },
    {
      question: "What if I miss a ride?",
      answer: "No problem! Our service runs continuously throughout the day with regular intervals. Just wait at any designated stop and the next vehicle will pick you up. Your pass is valid all day, so there's no rush."
    },
    {
      question: "Are attraction tickets included?",
      answer: "The day pass covers transportation only. However, you can add attraction tickets to your booking during checkout for a bundled experience. This saves you time and often money compared to buying separately."
    }
  ];

  // Generate structured data for SEO
  const generateStructuredData = () => {
    // Product schema for the day pass service
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Hop On Sintra Day Pass",
      "description": "Unlimited hop-on/hop-off day pass for exploring Sintra's palaces and attractions. Guaranteed seating in tuk-tuks and UMM jeeps with service from 9am to 7pm daily.",
      "brand": {
        "@type": "Brand",
        "name": "Hop On Sintra"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "url": "https://hoponsintra.com/hop-on-service",
        "validFrom": new Date().toISOString(),
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "523",
        "bestRating": "5"
      },
      "category": "Transportation Service"
    };

    // FAQPage schema for the FAQ section
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };

    // Organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Hop On Sintra",
      "url": "https://hoponsintra.com",
      "logo": "https://hoponsintra.com/logo.png",
      "description": "Hop-on/hop-off day pass service in Sintra, Portugal offering unlimited rides on tuk-tuks and UMM jeeps with guaranteed seating.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sintra",
        "addressCountry": "PT"
      },
      "sameAs": []
    };

    // TouristAttraction schema for the service
    const touristAttractionSchema = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": "Hop On Sintra Transportation Service",
      "description": "Hop-on/hop-off transportation service connecting all major Sintra attractions including Pena Palace, Quinta da Regaleira, and more.",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "38.7969",
        "longitude": "-9.3894"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sintra",
        "addressCountry": "PT"
      }
    };

    // BreadcrumbList schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://hoponsintra.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Hop On Service",
          "item": "https://hoponsintra.com/hop-on-service"
        }
      ]
    };

    return {
      product: productSchema,
      faq: faqSchema,
      organization: organizationSchema,
      touristAttraction: touristAttractionSchema,
      breadcrumb: breadcrumbSchema
    };
  };

  return (
    <div className="flex-1">
      {/* Page-specific Open Graph tags for social media sharing */}
      <Helmet>
        {/* Open Graph tags */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content="Hop On Sintra Day Pass - Unlimited Access to All Attractions" />
        <meta 
          property="og:description" 
          content="Explore Sintra with unlimited hop-on/hop-off access. Guaranteed seating, 9am-7pm service. Visit all major palaces and attractions at your pace." 
        />
        <meta property="og:url" content="https://hoponsintra.com/hop-on-service" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=630&fit=crop" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Hop On Sintra - Tuk-tuk transportation in Sintra, Portugal" />
        <meta property="og:site_name" content="Hop On Sintra" />
        <meta property="og:locale" content={language === 'en' ? 'en_US' : `${language}_${language.toUpperCase()}`} />
        <meta property="product:price:amount" content="25.00" />
        <meta property="product:price:currency" content="EUR" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hop On Sintra Day Pass - Unlimited Access to All Attractions" />
        <meta 
          name="twitter:description" 
          content="Explore Sintra with unlimited hop-on/hop-off access. Guaranteed seating, 9am-7pm service. Visit all major palaces and attractions at your pace." 
        />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=630&fit=crop" />
        <meta name="twitter:image:alt" content="Hop On Sintra - Tuk-tuk transportation in Sintra, Portugal" />
        
        {/* Additional meta tags */}
        <meta name="author" content="Hop On Sintra" />
        <link rel="canonical" href="https://hoponsintra.com/hop-on-service" />
      </Helmet>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData()),
        }}
      />

      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] sm:h-[60vh] sm:min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&h=1080&fit=crop"
          alt="Hop On Sintra Service"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-8 sm:pb-12 md:pb-16 lg:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.h1
                className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Hop On Sintra Day Pass
              </motion.h1>

              <motion.p
                className="max-w-2xl text-lg sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Unlimited hop-on/hop-off access to all of Sintra's top attractions with guaranteed seating
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Bus className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">
                    Unlimited Rides
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">
                    9am - 7pm Daily
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Left Column - Information */}
            <div className="space-y-8 sm:space-y-12 lg:col-span-2 min-w-0">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-4 sm:mb-5 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Your Ticket to Explore Sintra
                </h2>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground mb-4">
                  The Hop On Sintra day pass is your key to discovering one of Portugal's most enchanting destinations. With unlimited rides throughout the day, you have the freedom to explore Sintra's magnificent palaces, historic castles, and breathtaking viewpoints at your own pace.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  No fixed schedules, no rushing between attractions. Simply show your pass at any of our designated stops and hop aboard one of our comfortable tuk-tuks or UMM jeeps. Our professional drivers know Sintra's winding roads like the back of their hand, ensuring safe and efficient transportation while you sit back and enjoy the scenery.
                </p>
              </motion.div>

              {/* Image Gallery Carousel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="mb-6 sm:mb-8"
              >
                <Badge className="mb-3 sm:mb-4">
                  <Camera className="mr-1 h-3 w-3" />
                  Gallery
                </Badge>
                <div className="w-full max-w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-lg bg-gray-100">
                  <div className="w-full max-w-full">
                    <Slider
                      dots={true}
                      infinite={true}
                      speed={500}
                      slidesToShow={1}
                      slidesToScroll={1}
                      arrows={true}
                      autoplay={true}
                      autoplaySpeed={4000}
                      prevArrow={<PrevArrow />}
                      nextArrow={<NextArrow />}
                      adaptiveHeight={false}
                      cssEase="ease-in-out"
                    >
                      {galleryImages.map((image, index) => (
                        <div key={index} className="w-full">
                          <div className="h-[250px] sm:h-[350px] lg:h-[450px] w-full bg-gray-200">
                            <img
                              src={image}
                              alt={`Hop On Sintra Service - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image: ${image}`);
                                e.currentTarget.src =
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </div>
                </div>
              </motion.div>

              {/* Service Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-foreground">
                  What's Included
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <Card key={index} className="p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* FAQ Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {faqItems.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border rounded-lg px-4 bg-white shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>

              {/* Call to Action - Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:hidden"
              >
                <Card className="p-6 sm:p-8 bg-gradient-to-br from-primary to-primary/90 text-white shadow-xl">
                  <h3 className="text-2xl font-bold mb-3">
                    Ready to Explore Sintra?
                  </h3>
                  <p className="mb-6 text-white/90">
                    Get your day pass now and start discovering Sintra's magical attractions at your own pace.
                  </p>
                  <Button
                    onClick={() => navigate("/buy-ticket")}
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    Book Your Day Pass
                  </Button>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 hidden lg:block">
              {/* Booking Card - Desktop */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="sticky top-6"
              >
                <Card className="p-6 shadow-xl">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Book Your Pass
                    </h3>
                    <p className="text-muted-foreground">
                      Unlimited access to all attractions
                    </p>
                  </div>

                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Valid for one full day</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>Service: 9am - 7pm daily</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Group discounts available</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Multiple pickup locations</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/buy-ticket")}
                    size="lg"
                    className="w-full font-semibold"
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    Book Now
                  </Button>

                  <p className="mt-4 text-xs text-center text-muted-foreground">
                    Instant confirmation • Flexible booking
                  </p>
                </Card>

                {/* Why Choose Card */}
                <Card className="p-6 shadow-lg mt-6 bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Why Passengers Love Us
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">No waiting for buses or taxis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Skip parking hassles completely</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">See more in less time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Authentic Portuguese vehicles</span>
                    </li>
                  </ul>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}