import { useState, useEffect } from "react";
import { createBooking, createPaymentIntent } from "../lib/api";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { safeJsonFetch } from '../lib/apiErrorHandler';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Calendar as CalendarIcon, Calendar, Users, MapPin, Phone, Mail, CheckCircle, Loader2, Check, ChevronLeft, ChevronRight, RefreshCw, Car, ArrowRight, User, CreditCard, Ticket, Receipt, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { StripePaymentForm } from "./StripePaymentForm";
import { getTranslation } from "../lib/translations";

// FEATURE FLAG: Set to false to disable attraction ticket sales
// To re-enable in the future, simply change this to true
const ENABLE_ATTRACTION_TICKETS = false;

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
    "pena-palace-park": { name: "Pena Palace Park Only", price: 8 },
    "pena-palace-full": { name: "Pena Palace & Park", price: 14 },
    "quinta-regaleira": { name: "Quinta da Regaleira", price: 12 },
    "moorish-castle": { name: "Moorish Castle", price: 10 },
    "monserrate-palace": { name: "Monserrate Palace", price: 10 },
    "sintra-palace": { name: "Sintra National Palace", price: 10 },
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

export function BuyTicketPage({ onNavigate, onBookingComplete, language }: BuyTicketPageProps) {
  const t = getTranslation(language);
  
  const PICKUP_LOCATIONS = [
    { value: "sintra-train-station", label: t.buyTicket.pickupLocations.sintraTrainStation },
    { value: "sintra-town-center", label: t.buyTicket.pickupLocations.sintraTownCenter },
    { value: "pena-palace", label: t.buyTicket.pickupLocations.penaPalace },
    { value: "quinta-regaleira", label: t.buyTicket.pickupLocations.quintaRegaleira },
    { value: "moorish-castle", label: t.buyTicket.pickupLocations.moorishCastle },
    { value: "monserrate-palace", label: t.buyTicket.pickupLocations.monserratePalace },
    { value: "sintra-palace", label: t.buyTicket.pickupLocations.sintraPalace },
    { value: "other", label: t.buyTicket.pickupLocations.other },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [availability, setAvailability] = useState<AvailabilitySettings>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null);
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

  // Load pricing from database and fallback to localStorage
  useEffect(() => {
    async function loadPricingFromDB() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
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
          if (data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...data.pricing.attractions,
              }
            });
            // Save to localStorage for offline use
            localStorage.setItem("admin-pricing", JSON.stringify(data.pricing));
            console.log('✅ Loaded pricing from database');
            return;
          }
        }
      } catch (error) {
        // Silently handle error - backend may not be available
      }
      
      // Fallback to localStorage if database fetch fails
      const savedPricing = localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          const parsed = JSON.parse(savedPricing);
          setPricing({
            ...DEFAULT_PRICING,
            ...parsed,
            attractions: {
              ...DEFAULT_PRICING.attractions,
              ...parsed.attractions,
            }
          });
          console.log('ℹ️ Using saved pricing');
        } catch (e) {
          console.log('ℹ️ Using default pricing');
        }
      }
    }
    
    loadPricingFromDB();
  }, []);

  // Load availability from backend when date is selected
  useEffect(() => {
    if (formData.date) {
      loadAvailabilityForDate(formData.date);
    }
  }, [formData.date]);

  // Create payment intent when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && !paymentClientSecret && !isCreatingPayment) {
      createStripePaymentIntent();
    }
  }, [currentStep]);

  const loadAvailabilityForDate = async (date: string) => {
    setLoadingAvailability(true);
    
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability/${date}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (result?.success && result.availability) {
      setAvailability(prev => ({
        ...prev,
        [date]: result.availability
      }));
    }
    
    setLoadingAvailability(false);
  };

  const attractions = Object.entries(pricing.attractions).map(([id, data]) => ({
    id,
    name: data.name,
    price: data.price
  }));

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getAvailability = (date: string, timeSlot: string): number => {
    return availability[date]?.[timeSlot] ?? 50; // Default 50 seats
  };

  const guidedTourTimes = ["10:00", "14:00"];
  const isGuidedTourTime = guidedTourTimes.includes(formData.timeSlot);
  const basePrice = pricing.basePrice;
  const guidedTourSurcharge = pricing.guidedTourSurcharge;
  const passTotal = basePrice * formData.quantity;
  const guidedTourTotal = isGuidedTourTime ? guidedTourSurcharge * formData.quantity : 0;
  const attractionsTotal = formData.selectedAttractions.reduce((total, id) => {
    const attraction = attractions.find(a => a.id === id);
    return total + ((attraction?.price || 0) * formData.quantity);
  }, 0);
  const totalPrice = passTotal + guidedTourTotal + attractionsTotal;

  const toggleAttraction = (attractionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAttractions: prev.selectedAttractions.includes(attractionId)
        ? prev.selectedAttractions.filter(id => id !== attractionId)
        : [...prev.selectedAttractions, attractionId]
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
        throw new Error(response.error || "Failed to create payment intent");
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to initialize payment";
      setPaymentInitError(errorMsg);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentSuccess = async (confirmedPaymentIntentId: string) => {
    setIsSubmitting(true);
    
    try {
      // Create booking data
      const passengers = Array.from({ length: formData.quantity }, (_, i) => ({
        name: i === 0 ? formData.fullName : `Passenger ${i + 1}`,
        type: "Adult",
      }));

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
        guidedTour: isGuidedTourTime ? {
          type: "Small Group",
          price: guidedTourTotal,
        } : null,
        selectedAttractions: formData.selectedAttractions.map(id => {
          const attraction = attractions.find(a => a.id === id);
          return {
            id,
            name: attraction?.name || id,
            tickets: formData.quantity,
            price: (attraction?.price || 0) * formData.quantity,
          };
        }),
        totalPrice,
        paymentIntentId: confirmedPaymentIntentId,
      };

      // Create booking via API
      const response = await createBooking(bookingData);
      
      if (response.success && response.data?.booking) {
        // Navigate to confirmation page with booking data
        onBookingComplete(response.data.booking);
        
        // Show success toast
        if (response.data.emailSent) {
          toast.success("Booking confirmed! Check your email for QR codes.");
        } else {
          toast.success("Booking confirmed! QR codes are ready.");
          
          // Check for specific email error details
          const emailError = response.data.emailError;
          
          if (emailError) {
            console.error("Email sending failed:", emailError);
            
            // Check if domain verification is needed
            if (emailError.includes("Domain verification required") || emailError.includes("verify") || emailError.includes("only send testing emails")) {
              toast.warning("⚠️ Email system requires domain verification. QR codes are available on this page.", {
                duration: 7000,
              });
            } else if (emailError.includes("No email address")) {
              toast.warning("⚠️ No email address provided. Save your QR codes from this page.", {
                duration: 6000,
              });
            } else {
              // Show generic email error with details
              toast.warning(`⚠️ Email couldn't be sent: ${emailError}. Save your QR codes from this page.`, {
                duration: 7000,
              });
            }
          } else {
            // Email error without details
            toast.warning("Email couldn't be sent. Save your QR codes from this page.", {
              duration: 6000,
            });
          }
        }
      } else {
        throw new Error(response.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete booking. Please try again.";
      
      // Check if it's an availability error
      if (errorMessage.includes("Not enough seats") || errorMessage.includes("available")) {
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

  const canProceedStep1 = formData.date && formData.timeSlot && formData.pickupLocation && formData.quantity >= 1;
  const canProceedStep3 = formData.fullName && formData.email && formData.confirmEmail && formData.email === formData.confirmEmail;

  return (
    <div className="flex-1 bg-secondary/30">{/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-12 sm:py-16">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-3 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-foreground">
            {t.buyTicket.hero.title}
          </h1>
          <div className="mx-auto mb-6 h-1 w-20 rounded-full bg-accent" />
          
          {/* Progress Steps */}
          <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  currentStep >= step 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-muted-foreground border-2 border-border'
                }`}>
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div className={`h-1 w-8 sm:w-16 transition-all ${
                    currentStep > step ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <p className="text-muted-foreground">
              {currentStep === 1 && t.buyTicket.steps.step1Description}
              {currentStep === 2 && t.buyTicket.steps.step2Description}
              {currentStep === 3 && t.buyTicket.steps.step3Description}
              {currentStep === 4 && t.buyTicket.steps.step4Description}
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div>
            {/* Step 1: Date & Group */}
            {currentStep === 1 && (
              <Card className="border-border p-8">
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-foreground">{t.buyTicket.dateSelection.planYourVisit}</h2>
                  </div>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                  <p className="mt-4 text-muted-foreground">
                    {t.buyTicket.dateSelection.planYourVisitDescription}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="date" className="text-foreground">{t.buyTicket.dateSelection.selectDate}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`mt-2 w-full justify-start text-left border-border ${
                              !formData.date && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(new Date(formData.date), "PPP") : t.buyTicket.dateSelection.pickDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={formData.date ? new Date(formData.date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleInputChange("date", format(date, "yyyy-MM-dd"));
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="timeSlot" className="text-foreground">{t.buyTicket.dateSelection.preferredStartTime}</Label>
                      {loadingAvailability && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t.buyTicket.dateSelection.checkingAvailability}
                        </p>
                      )}
                      <Select
                        value={formData.timeSlot}
                        onValueChange={(value) => {
                          handleInputChange("timeSlot", value);
                        }}
                        disabled={!formData.date || loadingAvailability}
                      >
                        <SelectTrigger className="mt-2 border-border">
                          <SelectValue placeholder={t.buyTicket.dateSelection.selectTime} />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => {
                            const seats = formData.date ? getAvailability(formData.date, slot.value) : 50;
                            const isLowAvailability = seats < 10 && seats > 0;
                            const isSoldOut = seats === 0;
                            
                            return (
                              <SelectItem 
                                key={slot.value} 
                                value={slot.value}
                                disabled={isSoldOut}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <span>{slot.label}</span>
                                  {formData.date && (
                                    <span className={`text-xs ${
                                      isSoldOut ? 'text-destructive' : 
                                      isLowAvailability ? 'text-accent' : 
                                      'text-muted-foreground'
                                    }`}>
                                      {isSoldOut ? t.buyTicket.dateSelection.soldOut : isLowAvailability ? t.buyTicket.dateSelection.limited : t.buyTicket.dateSelection.available}
                                    </span>
                                  )}
                                  {slot.isGuided && (
                                    <span className="text-xs text-accent">
                                      {t.buyTicket.timeSlots.guidedTourLabel}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-muted-foreground">{t.buyTicket.dateSelection.passValidFullDay}</p>
                      {formData.date && formData.timeSlot && (
                        <p className={`mt-1 ${
                          getAvailability(formData.date, formData.timeSlot) === 0 ? 'text-destructive' :
                          getAvailability(formData.date, formData.timeSlot) < 10 ? 'text-accent' :
                          'text-primary'
                        }`}>
                          {getAvailability(formData.date, formData.timeSlot) === 0 ? t.buyTicket.dateSelection.soldOutForTime :
                           getAvailability(formData.date, formData.timeSlot) < 10 ? t.buyTicket.dateSelection.limitedAvailability :
                           t.buyTicket.dateSelection.goodAvailability}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pickupLocation" className="text-foreground">{t.buyTicket.dateSelection.preferredPickupSpot}</Label>
                    <Select
                      value={formData.pickupLocation}
                      onValueChange={(value) => handleInputChange("pickupLocation", value)}
                    >
                      <SelectTrigger className="mt-2 border-border">
                        <SelectValue placeholder={t.buyTicket.dateSelection.pickupPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {PICKUP_LOCATIONS.map((location) => (
                          <SelectItem key={location.value} value={location.value}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-muted-foreground">{t.buyTicket.dateSelection.pickupHelpText}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-foreground">{t.buyTicket.dateSelection.numberOfGuests}</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-12 w-12 border-border"
                        onClick={() => handleInputChange("quantity", Math.max(1, formData.quantity - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange("quantity", Math.max(1, parseInt(e.target.value) || 1))}
                        className="border-border text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-12 w-12 border-border"
                        onClick={() => handleInputChange("quantity", Math.min(50, formData.quantity + 1))}
                      >
                        +
                      </Button>
                    </div>
                    {formData.quantity <= 6 ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Car className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <p>
                            {t.buyTicket.dateSelection.vehicleDispatchSmall} {formData.quantity}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                          <p>
                            {t.buyTicket.dateSelection.vehicleDispatchLarge} <strong className="text-foreground">{Math.ceil(formData.quantity / 6)} {t.buyTicket.dateSelection.vehicles}</strong> {t.buyTicket.dateSelection.coordinatedToArrive}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Guided Tour Info */}
                  {isGuidedTourTime && (
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="text-foreground">
                            {t.buyTicket.dateSelection.guidedCommentaryIncluded}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {t.buyTicket.dateSelection.guidedCommentaryDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Summary for Step 1 */}
                  <div className="rounded-lg bg-secondary/50 p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">{t.buyTicket.dateSelection.dayPassPriceSummary}{isGuidedTourTime ? ` ${t.buyTicket.dateSelection.dayPassWithGuided}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl text-primary">€{passTotal + guidedTourTotal}</p>
                        <p className="text-muted-foreground">{t.buyTicket.dateSelection.forGuests} {formData.quantity} {formData.quantity === 1 ? t.buyTicket.dateSelection.guest : t.buyTicket.dateSelection.guests}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                  >
                    {t.buyTicket.dateSelection.continueButton}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Attraction Tickets */}
            {currentStep === 2 && (
              <Card className="border-border p-8">
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-foreground">Add Attraction Tickets?</h2>
                  </div>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                  {ENABLE_ATTRACTION_TICKETS ? (
                    <p className="mt-4 text-muted-foreground">
                      Skip the ticket lines! Add entrance tickets to popular attractions. {formData.quantity > 1 ? `Prices shown for ${formData.quantity} guests.` : ''}
                    </p>
                  ) : (
                    <p className="mt-4 text-muted-foreground">
                      Attraction tickets are not yet available for online purchase. You can buy tickets at each attraction entrance.
                    </p>
                  )}
                </div>

                {ENABLE_ATTRACTION_TICKETS ? (
                  <>
                    <div className="space-y-3">
                      {attractions.map((attraction) => (
                        <div
                          key={attraction.id}
                          className={`flex items-center gap-3 rounded-lg border-2 p-5 transition-all cursor-pointer ${
                            formData.selectedAttractions.includes(attraction.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-white hover:border-primary/30'
                          }`}
                          onClick={() => toggleAttraction(attraction.id)}
                        >
                          <input
                            type="checkbox"
                            id={attraction.id}
                            checked={formData.selectedAttractions.includes(attraction.id)}
                            onChange={() => toggleAttraction(attraction.id)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={attraction.id}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <span className="text-foreground">{attraction.name}</span>
                            <span className="text-primary">
                              +€{attraction.price * formData.quantity}
                              {formData.quantity > 1 && <span className="ml-1 text-muted-foreground">(€{attraction.price} each)</span>}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>

                    {formData.selectedAttractions.length > 0 && (
                      <div className="mt-6 rounded-lg bg-accent/5 p-4">
                        <p className="text-muted-foreground">
                          💡 <strong>Tip:</strong> You'll receive digital tickets via email along with your {formData.quantity === 1 ? 'day pass QR code' : `${formData.quantity} day pass QR codes`}.
                        </p>
                      </div>
                    )}

                    {/* Price Summary for Step 2 */}
                    <div className="mt-6 rounded-lg bg-secondary/50 p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Day Pass{isGuidedTourTime ? ' (includes guided commentary)' : ''}</span>
                          <span>€{passTotal + guidedTourTotal}</span>
                        </div>
                        {attractionsTotal > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Attraction Tickets</span>
                            <span>€{attractionsTotal}</span>
                          </div>
                        )}
                        <div className="border-t border-border pt-2 flex justify-between items-center">
                          <p className="text-foreground">Total</p>
                          <p className="text-2xl text-primary">€{totalPrice}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Coming Soon Message */}
                    <div className="rounded-lg border bg-secondary/30 p-8 text-center">
                      <Badge variant="outline" className="mb-4 text-muted-foreground">
                        Online Booking Coming Soon
                      </Badge>
                      <p className="mb-6 text-muted-foreground">
                        We're working on adding the ability to purchase attraction tickets online. For now, tickets can be purchased at each attraction entrance.
                      </p>
                      <div className="rounded-lg bg-primary/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          💡 Your Go Sintra day pass gets you unlimited transport to all attractions. Tickets are available for purchase when you arrive!
                        </p>
                      </div>
                    </div>

                    {/* Price Summary for Step 2 - Day Pass Only */}
                    <div className="mt-6 rounded-lg bg-secondary/50 p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Day Pass{isGuidedTourTime ? ' (includes guided commentary)' : ''}</span>
                          <span>€{passTotal + guidedTourTotal}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between items-center">
                          <p className="text-foreground">Total</p>
                          <p className="text-2xl text-primary">€{totalPrice}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleNext}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Your Information */}
            {currentStep === 3 && (
              <Card className="border-border p-8">
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-foreground">Your Information</h2>
                  </div>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        className="border-border pl-10"
                        required
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="border-border pl-10"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-muted-foreground">Your QR code will be sent here</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmEmail" className="text-foreground">Confirm Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmEmail"
                        type="email"
                        placeholder="john@example.com"
                        className="border-border pl-10"
                        required
                        value={formData.confirmEmail}
                        onChange={(e) => handleInputChange("confirmEmail", e.target.value)}
                      />
                    </div>
                    {formData.confirmEmail && formData.email !== formData.confirmEmail && (
                      <p className="mt-1 text-destructive">Emails don't match</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleNext}
                    disabled={!canProceedStep3}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Order Summary */}
                <div className="order-2 lg:order-1 lg:col-span-1">
                  <Card className="lg:sticky lg:top-4 border-border p-6">
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h3 className="text-foreground">Order Summary</h3>
                      </div>
                      <div className="h-1 w-16 rounded-full bg-accent" />
                    </div>
                    
                    <div className="space-y-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="break-words">{formData.date} starting at {formData.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="break-words">{PICKUP_LOCATIONS.find(loc => loc.value === formData.pickupLocation)?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{formData.quantity} {formData.quantity === 1 ? 'guest' : 'guests'}</span>
                      </div>
                      
                      <div className="border-t border-border pt-3 mt-3 space-y-2">
                        <div className="flex justify-between gap-2">
                          <span className="flex-shrink-0">Day Pass (×{formData.quantity}){isGuidedTourTime ? ' + Guided' : ''}</span>
                          <span className="flex-shrink-0">€{passTotal + guidedTourTotal}</span>
                        </div>
                        {formData.selectedAttractions.length > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="flex-shrink-0">Attraction Tickets</span>
                            <span className="flex-shrink-0">€{attractionsTotal}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t border-border pt-3 mt-3 flex justify-between items-center gap-2">
                        <span className="text-foreground flex-shrink-0">Total</span>
                        <span className="text-2xl text-primary flex-shrink-0">€{totalPrice}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-2 rounded-lg bg-primary/5 p-4">
                      <p className="text-foreground">✓ Unlimited hop-on/hop-off until 8:00 PM</p>
                      <p className="text-foreground">✓ Guaranteed seating in small vehicles</p>
                      <p className="text-foreground">✓ Flexible - use anytime during operating hours</p>
                      <p className="text-foreground">✓ {formData.quantity === 1 ? 'QR code' : `${formData.quantity} QR codes`} sent via email</p>
                      {isGuidedTourTime && (
                        <p className="text-foreground">✓ Guided commentary included</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Payment Form */}
                <div className="order-1 lg:order-2 lg:col-span-2">
                  <Card className="border-border p-8">
                    <div className="mb-8">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-foreground">Payment Details</h2>
                      </div>
                      <div className="h-1 w-16 rounded-full bg-accent" />
                    </div>

                    {paymentInitError ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <div className="text-center space-y-2">
                          <p className="text-foreground">Payment initialization failed</p>
                          <p className="text-sm text-muted-foreground">{paymentInitError}</p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={createStripePaymentIntent}
                            size="lg"
                            className="bg-primary hover:bg-primary/90"
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
                            <ChevronLeft className="mr-2 h-5 w-5" />
                            Go Back
                          </Button>
                        </div>
                      </div>
                    ) : isCreatingPayment || !paymentClientSecret ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Preparing secure payment...</p>
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
                        
                        <div className="mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={handleBack}
                            className="w-full sm:w-auto"
                            disabled={isSubmitting}
                          >
                            <ChevronLeft className="mr-2 h-5 w-5" />
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