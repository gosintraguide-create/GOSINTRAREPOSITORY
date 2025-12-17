import { useState, useEffect } from "react";
import { toast } from "sonner@2.0.3";
import { createBooking, createPaymentIntent } from "../lib/api";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { getTranslation } from "../lib/translations";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Ticket,
  User,
  Mail,
  CreditCard,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Loader2,
  Car,
  Receipt,
  RefreshCw,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { StripePaymentForm } from "./StripePaymentForm";
import { PickupLocationMap } from "./PickupLocationMap";

interface BuyTicketPageProps {
  onNavigate: (page: string) => void;
  onBookingComplete: (booking: any) => void;
  language: string;
}

interface PricingSettings {
  basePrice: number;
  guidedTourSurcharge: number;
  attractions: {
    [key: string]: { name: string; price: number };
  };
}

interface AvailabilitySettings {
  [date: string]: {
    [timeSlot: string]: number;
  };
}

const DEFAULT_PRICING: PricingSettings = {
  basePrice: 25,
  guidedTourSurcharge: 5,
  attractions: {
    "pena-palace-park": {
      name: "Pena Palace Park Only",
      price: 8,
    },
    "pena-palace-full": {
      name: "Pena Palace & Park",
      price: 14,
    },
    "quinta-regaleira": {
      name: "Quinta da Regaleira",
      price: 12,
    },
    "moorish-castle": { name: "Moorish Castle", price: 10 },
    "monserrate-palace": {
      name: "Monserrate Palace",
      price: 10,
    },
    "sintra-palace": {
      name: "Sintra National Palace",
      price: 10,
    },
    "convento-capuchos": {
      name: "Convento dos Capuchos",
      price: 8,
    },
    "cabo-da-roca": { name: "Cabo da Roca", price: 0 },
    "villa-sassetti": { name: "Villa Sassetti", price: 0 },
  },
};

const TIME_SLOTS = [
  { value: "9:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM", isGuided: true },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM", isGuided: true },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
];

export function BuyTicketPage({
  onNavigate,
  onBookingComplete,
  language,
}: BuyTicketPageProps) {
  const t = getTranslation(language);

  const PICKUP_LOCATIONS = [
    {
      value: "sintra-train-station",
      label: t.buyTicket.pickupLocations.sintraTrainStation,
    },
    {
      value: "sintra-town-center",
      label: t.buyTicket.pickupLocations.sintraTownCenter,
    },
    {
      value: "pena-palace",
      label: t.buyTicket.pickupLocations.penaPalace,
    },
    {
      value: "quinta-regaleira",
      label: t.buyTicket.pickupLocations.quintaRegaleira,
    },
    {
      value: "moorish-castle",
      label: t.buyTicket.pickupLocations.moorishCastle,
    },
    {
      value: "monserrate-palace",
      label: t.buyTicket.pickupLocations.monserratePalace,
    },
    {
      value: "sintra-palace",
      label: t.buyTicket.pickupLocations.sintraPalace,
    },
    {
      value: "other",
      label: t.buyTicket.pickupLocations.other,
    },
  ];
  // Feature flag for monument tickets
  const [monumentTicketsEnabled, setMonumentTicketsEnabled] =
    useState(false);
  
  // Master toggle for ticket purchases
  const [ticketPurchasesEnabled, setTicketPurchasesEnabled] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] =
    useState<PricingSettings>(DEFAULT_PRICING);
  const [availability, setAvailability] =
    useState<AvailabilitySettings>({});
  const [loadingAvailability, setLoadingAvailability] =
    useState(false);
  const [paymentClientSecret, setPaymentClientSecret] =
    useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<
    string | null
  >(null);
  const [isCreatingPayment, setIsCreatingPayment] =
    useState(false);
  const [paymentInitError, setPaymentInitError] = useState<
    string | null
  >(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    confirmEmail: "",
    date: "",
    timeSlot: "",
    selectedAttractions: [] as string[],
    quantity: 1,
    pickupLocation: "sintra-train-station" as string,
  });

  // Load feature flag from localStorage
  useEffect(() => {
    const checkFlags = () => {
      try {
        const flags = localStorage.getItem("feature-flags");
        if (flags) {
          const parsed = JSON.parse(flags);
          setMonumentTicketsEnabled(
            parsed.monumentTicketsEnabled === true,
          );
        }
      } catch (e) {
        console.error("Failed to parse feature flags:", e);
      }
    };

    checkFlags();
    window.addEventListener("storage", checkFlags);
    return () =>
      window.removeEventListener("storage", checkFlags);
  }, []);

  // Load pricing from database and fallback to localStorage
  useEffect(() => {
    async function loadPricingFromDB() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...(data.pricing.attractions || {}),
              },
            });
            // Save to localStorage for offline use
            localStorage.setItem(
              "admin-pricing",
              JSON.stringify(data.pricing),
            );
            console.log("✅ Loaded pricing from database");
            return;
          }
        } else if (response.status === 404) {
          console.warn(
            "⚠️ Backend not available (404). Using cached pricing.",
          );
          console.warn(
            "⚠️ Bookings may not work. Check /diagnostics page for backend status.",
          );
        }
      } catch (error) {
        // Silently handle error - backend may not be available
        console.warn(
          "⚠️ Backend connection failed. Using cached pricing.",
        );
      }

      // Fallback to localStorage if database fetch fails
      const savedPricing =
        localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          const parsed = JSON.parse(savedPricing);
          setPricing({
            ...DEFAULT_PRICING,
            ...parsed,
            attractions: {
              ...DEFAULT_PRICING.attractions,
              ...parsed.attractions,
            },
          });
          console.log("ℹ️ Using saved pricing");
        } catch (e) {
          console.log("ℹ️ Using default pricing");
        }
      }
    }

    loadPricingFromDB();

    // Load ticket purchases enabled setting
    async function loadTicketPurchasesSetting() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/settings/ticket-purchases-enabled`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setTicketPurchasesEnabled(data.enabled !== false);
          console.log("✅ Loaded ticket purchases setting:", data.enabled);
        }
      } catch (error) {
        console.error("Error loading ticket purchases setting:", error);
        setTicketPurchasesEnabled(true);
      }
    }
    loadTicketPurchasesSetting();
  }, []);

  // Load availability from backend when date is selected
  useEffect(() => {
    if (formData.date) {
      loadAvailabilityForDate(formData.date);
    }
  }, [formData.date]);

  // Create payment intent when reaching step 5
  useEffect(() => {
    if (
      currentStep === 5 &&
      !paymentClientSecret &&
      !isCreatingPayment
    ) {
      createStripePaymentIntent();
    }
  }, [currentStep]);

  const loadAvailabilityForDate = async (date: string) => {
    setLoadingAvailability(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability/${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.availability) {
          setAvailability((prev) => ({
            ...prev,
            [date]: data.availability,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    }

    setLoadingAvailability(false);
  };

  const attractions = Object.entries(pricing.attractions).map(
    ([id, data]) => ({
      id,
      name: data.name,
      price: data.price,
    }),
  );

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => {
      // If changing pickup location to "other", clear timeSlot
      if (field === "pickupLocation" && value === "other") {
        return { ...prev, [field]: value, timeSlot: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const getAvailability = (
    date: string,
    timeSlot: string,
  ): number => {
    return availability[date]?.[timeSlot] ?? 50; // Default 50 seats
  };

  const guidedTourTimes = ["10:00", "14:00"];
  const isGuidedTourTime = guidedTourTimes.includes(
    formData.timeSlot,
  );
  const basePrice = pricing.basePrice;
  const guidedTourSurcharge = pricing.guidedTourSurcharge;
  const passTotal = basePrice * formData.quantity;
  const guidedTourTotal = isGuidedTourTime
    ? guidedTourSurcharge * formData.quantity
    : 0;
  const attractionsTotal = formData.selectedAttractions.reduce(
    (total, id) => {
      const attraction = attractions.find((a) => a.id === id);
      return (
        total + (attraction?.price || 0) * formData.quantity
      );
    },
    0,
  );
  const totalPrice =
    passTotal + guidedTourTotal + attractionsTotal;

  const toggleAttraction = (attractionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAttractions: prev.selectedAttractions.includes(
        attractionId,
      )
        ? prev.selectedAttractions.filter(
            (id) => id !== attractionId,
          )
        : [...prev.selectedAttractions, attractionId],
    }));
  };

  const createStripePaymentIntent = async () => {
    setIsCreatingPayment(true);
    setPaymentInitError(null);
    try {
      const response = await createPaymentIntent(totalPrice, {
        customerName: formData.fullName,
        customerEmail: formData.email,
        date: formData.date,
        timeSlot: formData.timeSlot,
        quantity: formData.quantity,
      });

      if (response.success && response.data) {
        setPaymentClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId);
        setPaymentInitError(null);
      } else {
        throw new Error(
          response.error || "Failed to create payment intent",
        );
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to initialize payment";
      setPaymentInitError(errorMsg);
      toast.error(
        "Failed to initialize payment. Please try again.",
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePaymentSuccess = async (
    confirmedPaymentIntentId: string,
  ) => {
    console.log(
      `🎉 Payment succeeded! Payment Intent ID: ${confirmedPaymentIntentId}`,
    );
    setIsSubmitting(true);

    try {
      // Create booking data
      const passengers = Array.from(
        { length: formData.quantity },
        (_, i) => ({
          name:
            i === 0 ? formData.fullName : `Passenger ${i + 1}`,
          type: "Adult",
        }),
      );

      const bookingData = {
        contactInfo: {
          name: formData.fullName,
          email: formData.email,
          phone: "",
        },
        selectedDate: formData.date,
        timeSlot: formData.timeSlot,
        pickupLocation: formData.pickupLocation,
        passengers,
        guidedTour: isGuidedTourTime
          ? {
              type: "Small Group",
              price: guidedTourTotal,
            }
          : null,
        selectedAttractions: formData.selectedAttractions.map(
          (id) => {
            const attraction = attractions.find(
              (a) => a.id === id,
            );
            return {
              id,
              name: attraction?.name || id,
              tickets: formData.quantity,
              price:
                (attraction?.price || 0) * formData.quantity,
            };
          },
        ),
        totalPrice,
        paymentIntentId: confirmedPaymentIntentId,
      };

      console.log(
        `📤 Attempting to create booking with payment intent: ${confirmedPaymentIntentId}`,
      );

      // Create booking via API with retry logic
      let response;
      let lastError;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `🔄 Booking creation attempt ${attempt}/${maxRetries}`,
          );
          response = await createBooking(bookingData);

          // If we get a response, break the retry loop
          if (response) break;
        } catch (retryError) {
          lastError = retryError;
          console.error(
            `❌ Booking attempt ${attempt} failed:`,
            retryError,
          );

          // Only retry if it's a network error and we haven't hit max retries
          if (attempt < maxRetries) {
            console.log(`⏳ Waiting 1 second before retry...`);
            await new Promise((resolve) =>
              setTimeout(resolve, 1000),
            );
          }
        }
      }

      // If no response after retries, throw the last error
      if (!response) {
        throw (
          lastError ||
          new Error(
            "Failed to create booking after multiple attempts",
          )
        );
      }

      console.log("📥 Full booking response:", response);
      console.log("📥 Response structure check:", {
        hasSuccess: !!response.success,
        hasData: !!response.data,
        dataSuccess: response.data?.success,
        hasBooking: !!response.data?.booking,
        bookingId: response.data?.booking?.id,
      });

      // Check both outer and inner success flags
      if (
        response.success &&
        response.data?.success &&
        response.data?.booking
      ) {
        // Show success toast immediately
        if (response.data.emailSent) {
          toast.success(
            "Booking confirmed! Check your email for QR codes.",
          );
        } else {
          toast.success(
            "Booking confirmed! QR codes are ready.",
          );

          // Check for specific email error details
          const emailError = response.data.emailError;

          if (emailError) {
            console.error("Email sending failed:", emailError);

            // Check if domain verification is needed
            if (
              emailError.includes(
                "Domain verification required",
              ) ||
              emailError.includes("verify") ||
              emailError.includes("only send testing emails")
            ) {
              toast.warning(
                "⚠️ Email system requires domain verification. QR codes are available on this page.",
                {
                  duration: 7000,
                },
              );
            } else if (
              emailError.includes("No email address")
            ) {
              toast.warning(
                "⚠️ No email address provided. Save your QR codes from this page.",
                {
                  duration: 6000,
                },
              );
            } else {
              // Show generic email error with details
              toast.warning(
                `⚠️ Email couldn't be sent: ${emailError}. Save your QR codes from this page.`,
                {
                  duration: 7000,
                },
              );
            }
          } else {
            // Email error without details
            toast.warning(
              "Email couldn't be sent. Save your QR codes from this page.",
              {
                duration: 6000,
              },
            );
          }
        }

        // Small delay to ensure toast is visible before navigation
        await new Promise((resolve) =>
          setTimeout(resolve, 500),
        );

        // Navigate to confirmation page with booking data
        console.log(
          "🔄 Navigating to confirmation page with booking:",
          response.data.booking.id,
        );
        onBookingComplete(response.data.booking);
      } else {
        // Check if inner response has error
        const errorMsg =
          response.data?.error ||
          response.error ||
          "Failed to create booking";
        console.error("❌ Booking creation failed:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Booking error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to complete booking. Please try again.";

      // Special handling for 404 errors
      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("endpoint")
      ) {
        toast.error(
          "Server connection issue. Your payment was processed. Please contact support with your payment confirmation.",
          {
            duration: 10000,
          },
        );
        console.error(
          "⚠️ CRITICAL: Payment succeeded but booking creation failed with 404",
        );
        console.error(
          "⚠️ Payment Intent ID:",
          confirmedPaymentIntentId,
        );
        console.error("⚠️ Customer Email:", formData.email);
      }
      // Check if it's an availability error
      else if (
        errorMessage.includes("Not enough seats") ||
        errorMessage.includes("available")
      ) {
        toast.error(errorMessage);
        // Refresh availability for selected date
        if (formData.date) {
          loadAvailabilityForDate(formData.date);
        }
      } else {
        toast.error(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    toast.error(error || "Payment failed. Please try again.");
    setIsSubmitting(false);
  };

  // Validation for new Step 1: Date and Time
  const canProceedStep1 =
    formData.date &&
    formData.timeSlot &&
    ticketPurchasesEnabled;
  
  // Validation for new Step 2: Pickup and Quantity
  const canProceedStep2 =
    formData.pickupLocation &&
    formData.quantity >= 1;
  
  // Validation for Step 4 (Your Information)
  const canProceedStep4 =
    formData.fullName &&
    formData.email &&
    formData.confirmEmail &&
    formData.email === formData.confirmEmail;

  return (
    <div className="flex-1 bg-white">
      {/* Hero Section - Simplified */}
      <section className="border-b border-border bg-gradient-to-br from-secondary/30 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-2 text-foreground">
              {t.buyTicket.hero.title}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 1 && "Select your preferred date and start time"}
              {currentStep === 2 && "Choose pickup location and number of guests"}
              {currentStep === 3 &&
                t.buyTicket.steps.step2Description}
              {currentStep === 4 &&
                t.buyTicket.steps.step3Description}
              {currentStep === 5 &&
                t.buyTicket.steps.step4Description}
            </p>
          </div>

          {/* Progress Steps with Icons */}
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="flex items-start justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                      currentStep >= 1
                        ? "bg-accent text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > 1 ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <CalendarIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-center text-muted-foreground max-w-[80px] font-semibold">
                  Date & Time
                </p>
              </div>

              {/* Connector 1-2 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center h-12">
                  <div
                    className={`h-1 w-3/5 rounded-full transition-all ${
                      currentStep > 1 ? "bg-accent" : "bg-border"
                    }`}
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                      currentStep >= 2
                        ? "bg-accent text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > 2 ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <MapPin className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-center text-muted-foreground max-w-[80px] font-semibold">
                  Pickup Spot
                </p>
              </div>

              {/* Connector 2-3 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center h-12">
                  <div
                    className={`h-1 w-3/5 rounded-full transition-all ${
                      currentStep > 2 ? "bg-accent" : "bg-border"
                    }`}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                      currentStep >= 3
                        ? "bg-accent text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > 3 ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Ticket className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-center text-muted-foreground max-w-[80px] font-semibold">
                  Attractions
                </p>
              </div>

              {/* Connector 3-4 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center h-12">
                  <div
                    className={`h-1 w-3/5 rounded-full transition-all ${
                      currentStep > 3 ? "bg-accent" : "bg-border"
                    }`}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                      currentStep >= 4
                        ? "bg-accent text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > 4 ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-center text-muted-foreground max-w-[80px] font-semibold">
                  Your Details
                </p>
              </div>

              {/* Connector 4-5 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center h-12">
                  <div
                    className={`h-1 w-3/5 rounded-full transition-all ${
                      currentStep > 4 ? "bg-accent" : "bg-border"
                    }`}
                  />
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all z-10 ${
                      currentStep >= 5
                        ? "bg-accent text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    <Check className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-center text-muted-foreground max-w-[80px] font-semibold">
                  Confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div>
            {/* Step 1: Date & Time Selection */}
            {currentStep === 1 && (
              <Card className="border-border p-6 sm:p-8 shadow-sm">
                <div className="space-y-8">
                  {/* Insight Tour Info Banner */}
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-accent mb-1 font-semibold">
                          Insight Tour
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Select time slots include our <span className="font-semibold text-foreground">Insight Tour</span>, a longer and more detailed ride where the driver shares the stories and history behind Sintra's monuments. Look for time slots marked with the distinctive Insight Tour badge below.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sold Out Warning when ticket purchases disabled */}
                  {!ticketPurchasesEnabled && (
                    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">
                            Temporarily Unavailable
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            All dates are currently sold out. Please check back later or contact us for availability.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <h3 className="text-foreground mb-3 font-semibold">
                      Select Date
                    </h3>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left border-border h-14 px-4 ${
                            !formData.date &&
                            "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                          <span className="text-foreground">
                            {formData.date
                              ? format(
                                  new Date(formData.date),
                                  "EEEE, MMMM d, yyyy",
                                )
                              : t.buyTicket.dateSelection
                                  .pickDate}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <CalendarComponent
                          mode="single"
                          selected={
                            formData.date
                              ? new Date(formData.date)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange(
                                "date",
                                format(date, "yyyy-MM-dd"),
                              );
                              setIsDatePickerOpen(false);
                            }
                          }}
                          disabled={(date) =>
                            date <
                            new Date(
                              new Date().setHours(0, 0, 0, 0),
                            ) || !ticketPurchasesEnabled
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-foreground font-semibold">
                        Departure Time
                      </h3>
                      <div className="h-5 flex items-center">
                        {loadingAvailability && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {
                              t.buyTicket.dateSelection
                                .checkingAvailability
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const seats = formData.date
                          ? getAvailability(
                              formData.date,
                              slot.value,
                            )
                          : 50;
                        const isSoldOut = seats === 0;
                        const isLowAvailability = seats < 10 && seats > 0;
                        const isSelected = formData.timeSlot === slot.value;

                        return (
                          <div key={slot.value} className="relative">
                            {slot.isGuided && !isSoldOut && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[9px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap z-10">
                                Insight Tour
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSoldOut && formData.date) {
                                  handleInputChange(
                                    "timeSlot",
                                    slot.value,
                                  );
                                }
                              }}
                              disabled={!formData.date || isSoldOut || loadingAvailability}
                              className={`
                                w-full rounded-lg transition-all
                                ${slot.isGuided && !isSoldOut ? "h-16 border-2 border-primary flex flex-col items-center justify-center gap-1 py-2" : "h-12 flex items-center justify-center"}
                                ${
                                  isSelected
                                    ? "bg-accent text-white shadow-md"
                                    : isSoldOut
                                        ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                                        : "bg-secondary/50 text-foreground hover:bg-secondary/80"
                                }
                                ${!formData.date ? "opacity-50 cursor-not-allowed" : ""}
                              `}
                            >
                              <span className="font-semibold">{slot.label}</span>
                              {slot.isGuided && !isSoldOut && (
                                <span className="text-[11px] text-primary font-semibold">
                                  +€{guidedTourSurcharge}
                                </span>
                              )}
                            </button>
                            {formData.date && !isSoldOut && isLowAvailability && !slot.isGuided && (
                              <div className="absolute -top-1 -right-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                {seats} left
                              </div>
                            )}
                            {isSoldOut && (
                              <div className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                Sold Out
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {formData.date && formData.timeSlot && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Note:</span>{" "}
                        {
                          t.buyTicket.dateSelection
                            .passValidFullDay
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => window.history.back()}
                    className="text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white px-8"
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Pickup Location & Quantity */}
            {currentStep === 2 && (
              <Card className="border-border p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-foreground mb-1 font-semibold">
                    Pickup & Group Size
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Choose your pickup location and number of guests
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Pickup Location Card - Most Important */}
                  <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <Label
                          htmlFor="pickupLocation"
                          className="text-foreground font-semibold text-lg"
                        >
                          {
                            t.buyTicket.dateSelection
                              .preferredPickupSpot
                          }
                        </Label>
                      </div>

                      {/* Dropdown Selector - PRIMARY ACTION */}
                      <Select
                        value={formData.pickupLocation}
                        onValueChange={(value) =>
                          handleInputChange(
                            "pickupLocation",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="border-primary/30 h-14 text-base bg-white shadow-sm hover:border-primary/50 transition-colors">
                          <SelectValue
                            placeholder={
                              t.buyTicket.dateSelection
                                .pickupPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {PICKUP_LOCATIONS.map((location) => (
                            <SelectItem
                              key={location.value}
                              value={location.value}
                              className="text-base py-3"
                            >
                              {location.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {t.buyTicket.dateSelection.pickupHelpText}
                      </p>

                      {/* Interactive Map - COLLAPSIBLE REFERENCE */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                          <MapPin className="h-4 w-4" />
                          <span>{t.buyTicket?.timeSlots?.viewRouteMaps || "View route maps"}</span>
                          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <PickupLocationMap
                            selectedLocation={
                              formData.pickupLocation
                            }
                            onLocationSelect={(location) =>
                              handleInputChange(
                                "pickupLocation",
                                location,
                              )
                            }
                            language={language}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </Card>

                  {/* Number of Guests Card - Secondary Importance */}
                  <Card className="p-6 border border-border">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <Label
                          htmlFor="quantity"
                          className="text-foreground font-semibold text-lg"
                        >
                          {t.buyTicket.dateSelection.numberOfGuests}
                        </Label>
                      </div>
                      <div className="flex items-center justify-center gap-4 py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 rounded-full border-2 border-border hover:bg-accent hover:text-white hover:border-accent transition-all text-xl"
                          onClick={() =>
                            handleInputChange(
                              "quantity",
                              Math.max(1, formData.quantity - 1),
                            )
                          }
                        >
                          -
                        </Button>
                        <div className="flex items-center justify-center min-w-[100px] px-6 py-3 rounded-lg bg-secondary/30">
                          <span className="text-4xl text-foreground font-semibold">
                            {formData.quantity}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 rounded-full border-2 border-border hover:bg-accent hover:text-white hover:border-accent transition-all text-xl"
                          onClick={() =>
                            handleInputChange(
                              "quantity",
                              Math.min(50, formData.quantity + 1),
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Guided Tour Info */}
                  {isGuidedTourTime && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-semibold">
                            {
                              t.buyTicket.dateSelection
                                .guidedCommentaryIncluded
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Summary for Step 2 */}
                  <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-accent" />
                        </div>
                        <p className="text-foreground font-semibold text-lg">
                          Total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl text-accent font-semibold">
                          €{(passTotal + guidedTourTotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="mt-8 flex justify-between items-center pt-6 border-t border-border gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  >
                    <ChevronLeft className="mr-1 h-5 w-5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white px-10 h-12 shadow-lg hover:shadow-xl transition-all text-base"
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Attraction Tickets */}
            {currentStep === 3 && (
              <Card className="border-border p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-foreground mb-1 font-semibold">
                    Add Attraction Tickets?
                  </h2>
                  {monumentTicketsEnabled ? (
                    <p className="mt-4 text-muted-foreground">
                      <span className="font-semibold text-foreground">Skip the ticket lines!</span> Add entrance
                      tickets to popular attractions.{" "}
                      {formData.quantity > 1
                        ? `Prices shown for ${formData.quantity} guests.`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-4 text-muted-foreground">
                      Attraction tickets are not yet available
                      for online purchase. You can buy tickets
                      at each attraction entrance.
                    </p>
                  )}
                </div>

                {monumentTicketsEnabled ? (
                  <>
                    <div className="space-y-3">
                      {attractions.map((attraction) => (
                        <div
                          key={attraction.id}
                          className={`flex items-center gap-3 rounded-lg border-2 p-5 transition-all cursor-pointer ${
                            formData.selectedAttractions.includes(
                              attraction.id,
                            )
                              ? "border-primary bg-primary/5"
                              : "border-border bg-white hover:border-primary/30"
                          }`}
                          onClick={() =>
                            toggleAttraction(attraction.id)
                          }
                        >
                          <input
                            type="checkbox"
                            id={attraction.id}
                            checked={formData.selectedAttractions.includes(
                              attraction.id,
                            )}
                            onChange={() =>
                              toggleAttraction(attraction.id)
                            }
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={attraction.id}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <span className="text-foreground font-semibold">
                              {attraction.name}
                            </span>
                            <span className="text-primary font-semibold">
                              +€
                              {attraction.price *
                                formData.quantity}
                              {formData.quantity > 1 && (
                                <span className="ml-1 text-muted-foreground font-normal">
                                  (€{attraction.price} each)
                                </span>
                              )}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>

                    {formData.selectedAttractions.length >
                      0 && (
                      <div className="mt-6 rounded-lg bg-accent/5 p-4">
                        <p className="text-muted-foreground">
                          💡 <strong className="text-foreground">Tip:</strong> You'll
                          receive digital tickets via email
                          along with your{" "}
                          {formData.quantity === 1
                            ? "day pass QR code"
                            : `${formData.quantity} day pass QR codes`}
                          .
                        </p>
                      </div>
                    )}

                    {/* Price Summary for Step 2 */}
                    <div className="mt-6 rounded-lg bg-secondary/50 p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            Day Pass
                            {isGuidedTourTime
                              ? " (includes guided commentary)"
                              : ""}
                          </span>
                          <span>
                            €{passTotal + guidedTourTotal}
                          </span>
                        </div>
                        {attractionsTotal > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Attraction Tickets</span>
                            <span>€{attractionsTotal}</span>
                          </div>
                        )}
                        <div className="border-t border-border pt-2 flex justify-between items-center">
                          <p className="text-foreground font-semibold">
                            Total
                          </p>
                          <p className="text-2xl text-primary font-semibold">
                            €{totalPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Coming Soon Message */}
                    <div className="rounded-lg border bg-secondary/30 p-8 text-center">
                      <Badge
                        variant="outline"
                        className="mb-4 text-muted-foreground"
                      >
                        Online Booking Coming Soon
                      </Badge>
                      <p className="mb-6 text-muted-foreground">
                        We're working on adding the ability to
                        purchase attraction tickets online. For
                        now, tickets can be purchased at each
                        attraction entrance.
                      </p>
                      <div className="rounded-lg bg-primary/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          💡 Your Hop On Sintra day pass gets
                          you unlimited transport to all
                          attractions. Tickets are available for
                          purchase when you arrive!
                        </p>
                      </div>
                    </div>

                    {/* Price Summary for Step 2 - Day Pass Only */}
                    <div className="mt-6 rounded-lg bg-secondary/50 p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            Day Pass
                            {isGuidedTourTime
                              ? " (includes guided commentary)"
                              : ""}
                          </span>
                          <span>
                            €{passTotal + guidedTourTotal}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between items-center">
                          <p className="text-foreground font-semibold">
                            Total
                          </p>
                          <p className="text-2xl text-primary font-semibold">
                            €{totalPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleBack}
                    className="text-foreground hover:bg-transparent"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white px-8"
                    onClick={handleNext}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Your Information */}
            {currentStep === 4 && (
              <Card className="border-border p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-foreground mb-1 font-semibold">
                    Your Information
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="fullName"
                      className="text-foreground font-semibold"
                    >
                      Full Name
                    </Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        className="border-border pl-10 bg-white"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange(
                            "fullName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-foreground font-semibold"
                    >
                      Email Address
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="border-border pl-10 bg-white"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange(
                            "email",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Your QR code will be sent here
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="confirmEmail"
                      className="text-foreground font-semibold"
                    >
                      Confirm Email
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmEmail"
                        type="email"
                        placeholder="john@example.com"
                        className="border-border pl-10 bg-white"
                        required
                        value={formData.confirmEmail}
                        onChange={(e) =>
                          handleInputChange(
                            "confirmEmail",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    {formData.confirmEmail &&
                      formData.email !==
                        formData.confirmEmail && (
                        <p className="mt-1 text-destructive">
                          Emails don't match
                        </p>
                      )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleBack}
                    className="text-foreground hover:bg-transparent"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white px-8"
                    onClick={handleNext}
                    disabled={!canProceedStep4}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 5: Payment */}
            {currentStep === 5 && (
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Order Summary */}
                <div className="order-2 lg:order-1 lg:col-span-1">
                  <Card className="lg:sticky lg:top-4 border-border p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-foreground font-semibold">
                        Order Summary
                      </h3>
                    </div>

                    <div className="space-y-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="break-words">
                          {formData.date} starting at{" "}
                          {formData.timeSlot}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="break-words">
                          {
                            PICKUP_LOCATIONS.find(
                              (loc) =>
                                loc.value ===
                                formData.pickupLocation,
                            )?.label
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {formData.quantity}{" "}
                          {formData.quantity === 1
                            ? "guest"
                            : "guests"}
                        </span>
                      </div>

                      <div className="border-t border-border pt-3 mt-3 space-y-2">
                        <div className="flex justify-between gap-2">
                          <span className="flex-shrink-0">
                            Day Pass (×{formData.quantity})
                            {isGuidedTourTime
                              ? " + Guided"
                              : ""}
                          </span>
                          <span className="flex-shrink-0">
                            €{passTotal + guidedTourTotal}
                          </span>
                        </div>
                        {formData.selectedAttractions.length >
                          0 && (
                          <div className="flex justify-between gap-2">
                            <span className="flex-shrink-0">
                              Attraction Tickets
                            </span>
                            <span className="flex-shrink-0">
                              €{attractionsTotal}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border pt-3 mt-3 flex justify-between items-center gap-2">
                        <span className="text-foreground flex-shrink-0 font-semibold">
                          Total
                        </span>
                        <span className="text-3xl text-foreground flex-shrink-0 font-semibold">
                          €{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 rounded-lg bg-primary/5 p-4">
                      <p className="text-foreground">
                        ✓ Unlimited hop-on/hop-off until 8:00 PM
                      </p>
                      <p className="text-foreground">
                        ✓ Guaranteed seating in small vehicles
                      </p>
                      <p className="text-foreground">
                        ✓ Flexible - use anytime during
                        operating hours
                      </p>
                      <p className="text-foreground">
                        ✓{" "}
                        {formData.quantity === 1
                          ? "QR code"
                          : `${formData.quantity} QR codes`}{" "}
                        sent via email
                      </p>
                      {isGuidedTourTime && (
                        <p className="text-foreground">
                          ✓ Guided commentary included
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Payment Form */}
                <div className="order-1 lg:order-2 lg:col-span-2">
                  <Card className="border-border p-6 sm:p-8 shadow-sm">
                    <div className="mb-6">
                      <h2 className="text-foreground mb-1 font-semibold">
                        Payment Details
                      </h2>
                    </div>

                    {paymentInitError ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <div className="text-center space-y-2">
                          <p className="text-foreground font-semibold">
                            Payment initialization failed
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {paymentInitError}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={createStripePaymentIntent}
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-white"
                          >
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Retry
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={handleBack}
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Go Back
                          </Button>
                        </div>
                      </div>
                    ) : isCreatingPayment ||
                      !paymentClientSecret ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                          Preparing secure payment...
                        </p>
                      </div>
                    ) : (
                      <>
                        <StripePaymentForm
                          amount={totalPrice}
                          clientSecret={paymentClientSecret}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          customerEmail={formData.email}
                        />

                        <div className="mt-6 pt-6 border-t border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={handleBack}
                            className="text-foreground hover:bg-transparent"
                            disabled={isSubmitting}
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}