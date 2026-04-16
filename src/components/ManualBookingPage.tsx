import { useState, useEffect } from "react";
import { createBooking } from "../lib/api";
import { toast } from "sonner@2.0.3";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CheckCircle, Loader2, ArrowLeft, User, Users, Ticket, CreditCard, Banknote, Plus, Minus, ArrowRight, Baby } from "lucide-react";
import { format } from "date-fns";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getComponentTranslation } from "../lib/translations/components";

interface ManualBookingPageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

interface PricingSettings {
  basePrice: number;
  guidedTourSurcharge: number;
  attractions: {
    [key: string]: { name: string; price: number };
  };
}

const DEFAULT_PRICING: PricingSettings = {
  basePrice: 25,
  guidedTourSurcharge: 5,
  attractions: {
    "pena-palace-park": { name: "Pena Palace Park", price: 8 },
    "pena-palace-full": { name: "Pena Palace Full", price: 14 },
    "quinta-regaleira": { name: "Quinta da Regaleira", price: 12 },
    "moorish-castle": { name: "Moorish Castle", price: 10 },
    "monserrate-palace": { name: "Monserrate Palace", price: 10 },
    "sintra-palace": { name: "Sintra Palace", price: 10 },
    "convento-capuchos": { name: "Convento dos Capuchos", price: 8 },
    "cabo-da-roca": { name: "Cabo da Roca", price: 0 },
    "villa-sassetti": { name: "Villa Sassetti", price: 0 },
  },
};

const ATTRACTION_CARDS = [
  { id: "pena-palace-full", emoji: "🏰", shortName: "Pena Palace" },
  { id: "quinta-regaleira", emoji: "🌳", shortName: "Quinta" },
  { id: "moorish-castle", emoji: "🏛️", shortName: "Castle" },
  { id: "monserrate-palace", emoji: "🏛️", shortName: "Monserrate" },
  { id: "sintra-palace", emoji: "👑", shortName: "Sintra Palace" },
  { id: "pena-palace-park", emoji: "🌲", shortName: "Pena Park" },
  { id: "convento-capuchos", emoji: "⛪", shortName: "Capuchos" },
  { id: "cabo-da-roca", emoji: "🌊", shortName: "Cabo da Roca" },
  { id: "villa-sassetti", emoji: "🏛️", shortName: "Villa Sassetti" },
];

export function ManualBookingPage({ onNavigate, language }: ManualBookingPageProps) {
  // Block search engines from indexing this page
  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
    document.title = 'Manual Booking - Access Restricted';
  }, []);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<any>(null);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    quantity: 1,
    guidedTour: false,
    selectedAttractions: [] as string[],
    paymentMethod: "cash" as "cash" | "card",
  });

  // Load pricing from database and fallback to localStorage
  useEffect(() => {
    async function loadPricingFromDB() {
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
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
          if (data.success && data.pricing) {
            setPricing({
              ...pricing,
              ...data.pricing,
              attractions: {
                ...pricing.attractions,
                ...(data.pricing.attractions || {}),
              }
            });
            localStorage.setItem("admin-pricing", JSON.stringify(data.pricing));
            return;
          }
        }
      } catch (error) {
        // Silently handle error - backend may not be available
      }
      
      // Fallback to localStorage
      const savedPricing = localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          setPricing(JSON.parse(savedPricing));
        } catch (error) {
          // Use default pricing
        }
      }
    }
    
    loadPricingFromDB();
  }, []);

  const calculatePrice = () => {
    let total = 0;
    
    // Base prices
    total += formData.quantity * pricing.basePrice;
    
    // Guided tour
    if (formData.guidedTour) {
      total += formData.quantity * pricing.guidedTourSurcharge;
    }
    
    // Attractions
    formData.selectedAttractions.forEach(attractionId => {
      const attraction = pricing.attractions[attractionId];
      if (attraction) {
        total += attraction.price * formData.quantity;
      }
    });
    
    return total;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const now = new Date();
      const currentDate = format(now, "yyyy-MM-dd");
      const currentTime = format(now, "HH:mm");
      
      const totalPrice = calculatePrice();
      
      // Build passengers array
      const passengers = [];
      for (let i = 0; i < formData.quantity; i++) {
        passengers.push({ name: formData.customerName, type: "adult" });
      }
      
      const bookingData = {
        fullName: formData.customerName,
        email: formData.customerEmail,
        selectedDate: currentDate,
        timeSlot: currentTime,
        pickupLocation: "on-location",
        guidedTour: formData.guidedTour,
        passengers,
        attractions: formData.selectedAttractions.map(id => ({
          id,
          name: pricing.attractions[id].name,
          price: pricing.attractions[id].price,
        })),
        totalPrice,
        paymentMethod: formData.paymentMethod,
        paymentStatus: "completed",
        manualBooking: true,
        createdBy: "operations",
      };

      const response = await createBooking(bookingData);
      
      if (response.success) {
        setCompletedBooking(response.booking);
        setBookingComplete(true);
        toast.success("Booking created!");
        
        // Record manual sale for driver if logged in
        try {
          const driverSession = localStorage.getItem('driver_session');
          if (driverSession) {
            const { driver } = JSON.parse(driverSession);
            const quantity = formData.quantity;
            
            // Record the sale
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/record-sale`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  driverId: driver.id,
                  amount: totalPrice,
                  ticketType: 'day-pass',
                  quantity,
                  notes: `Manual booking: ${response.booking.id}`
                }),
              }
            );
          }
        } catch (error) {
          // Don't fail the booking if driver recording fails
          console.error('Failed to record driver sale:', error);
        }
        
        // Auto-reset form after 1.5 seconds to allow driver to make another sale immediately
        setTimeout(() => {
          resetForm();
        }, 1500);
      } else {
        toast.error(response.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      quantity: 1,
      guidedTour: false,
      selectedAttractions: [],
      paymentMethod: "cash",
    });
    setStep(1);
    setBookingComplete(false);
    setCompletedBooking(null);
  };

  const canProceedFromStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return formData.customerName.trim() && 
               formData.customerEmail.trim() && 
               formData.customerEmail.includes("@");
      case 2:
        return formData.quantity > 0;
      default:
        return true;
    }
  };

  // Success screen
  if (bookingComplete && completedBooking) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <Card className="border-border p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h1 className="mb-4 text-foreground">Booking Created!</h1>
            
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
                <Ticket className="h-6 w-6 text-primary" />
                <span className="text-2xl text-primary">
                  {completedBooking.id}
                </span>
              </div>
              <p className="mt-3 text-muted-foreground">
                Share this ID with customer
              </p>
            </div>

            <div className="mb-6 space-y-3 rounded-lg bg-secondary/50 p-6 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="text-foreground">{completedBooking.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passengers:</span>
                <span className="text-foreground">
                  {formData.quantity}A
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 mt-3">
                <span className="text-foreground">Total Paid:</span>
                <span className="text-foreground text-2xl">€{completedBooking.totalPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <Badge variant={formData.paymentMethod === "cash" ? "default" : "secondary"}>
                  {formData.paymentMethod === "cash" ? "💵 Cash" : "💳 Card"}
                </Badge>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                ✓ Tickets sent to {completedBooking.email}
              </p>
            </div>

            <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-900">
                ✓ Passengers automatically checked in
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={resetForm} className="flex-1" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                New Booking
              </Button>
              <Button variant="outline" onClick={() => onNavigate("operations")} className="flex-1" size="lg">
                Done
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const totalPrice = calculatePrice();
  const totalPassengers = formData.quantity;

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <Button variant="outline" onClick={() => onNavigate("operations")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-foreground">Quick Sale</h1>
            <Badge variant="outline" className="text-lg px-3 py-1">
              €{totalPrice.toFixed(2)}
            </Badge>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Customer Info */}
        {step === 1 && (
          <Card className="border-border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-foreground">Customer Info</h2>
                <p className="text-sm text-muted-foreground">Quick details</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Smith"
                  className="mt-2"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tickets sent here
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!canProceedFromStep(1)}
              className="w-full"
              size="lg"
            >
              Next: Passes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        )}

        {/* Step 2: Select Passes */}
        {step === 2 && (
          <Card className="border-border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-foreground">Select Passes</h2>
                <p className="text-sm text-muted-foreground">Tap to adjust</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {/* Adults */}
              <Card className="border-2 border-primary/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">👨</span>
                      <h3 className="text-foreground">Adult</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">€{pricing.basePrice}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData({ ...formData, quantity: Math.max(0, formData.quantity - 1) })}
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="text-2xl w-12 text-center text-foreground">
                      {formData.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="flex-1" size="lg">
                Back
              </Button>
              <Button
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!canProceedFromStep(2)}
                className="flex-1"
                size="lg"
              >
                Next: Add-ons
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Add-ons */}
        {step === 3 && (
          <Card className="border-border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-foreground">Add-ons</h2>
                <p className="text-sm text-muted-foreground">Optional extras</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Guided Tour */}
              <Card
                className={`border-2 p-4 cursor-pointer transition-all ${
                  formData.guidedTour
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, guidedTour: !formData.guidedTour })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <h3 className="text-foreground">Guided Tour</h3>
                      <p className="text-sm text-muted-foreground">
                        +€{pricing.guidedTourSurcharge} per person
                      </p>
                    </div>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    formData.guidedTour ? "bg-primary" : "bg-border"
                  }`}>
                    {formData.guidedTour && <CheckCircle className="h-5 w-5 text-white" />}
                  </div>
                </div>
              </Card>

              {/* Attraction Tickets */}
              <div>
                <Label className="mb-3 block">Attraction Tickets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ATTRACTION_CARDS.map((attraction) => {
                    const isSelected = formData.selectedAttractions.includes(attraction.id);
                    return (
                      <Card
                        key={attraction.id}
                        className={`border-2 p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              selectedAttractions: formData.selectedAttractions.filter(id => id !== attraction.id)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedAttractions: [...formData.selectedAttractions, attraction.id]
                            });
                          }
                        }}
                      >
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span className="text-2xl">{attraction.emoji}</span>
                          <p className="text-sm text-foreground">{attraction.shortName}</p>
                          <p className="text-xs text-muted-foreground">
                            €{pricing.attractions[attraction.id]?.price}
                          </p>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-accent mt-1" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 Tap cards to select. Prices are per person.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="flex-1" size="lg">
                Back
              </Button>
              <Button onClick={() => {
                setStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="flex-1" size="lg">
                Next: Payment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <Card className="border-border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-foreground">Payment</h2>
                <p className="text-sm text-muted-foreground">Choose method</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Payment Method */}
              <Card
                className={`border-2 p-4 cursor-pointer transition-all ${
                  formData.paymentMethod === "cash"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, paymentMethod: "cash" })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <h3 className="text-foreground">Cash</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay in cash
                      </p>
                    </div>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    formData.paymentMethod === "cash" ? "bg-primary" : "bg-border"
                  }`}>
                    {formData.paymentMethod === "cash" && <CheckCircle className="h-5 w-5 text-white" />}
                  </div>
                </div>
              </Card>

              <Card
                className={`border-2 p-4 cursor-pointer transition-all ${
                  formData.paymentMethod === "card"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💳</span>
                    <div>
                      <h3 className="text-foreground">Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay with card
                      </p>
                    </div>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    formData.paymentMethod === "card" ? "bg-primary" : "bg-border"
                  }`}>
                    {formData.paymentMethod === "card" && <CheckCircle className="h-5 w-5 text-white" />}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="flex-1" size="lg">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ManualBookingPage;