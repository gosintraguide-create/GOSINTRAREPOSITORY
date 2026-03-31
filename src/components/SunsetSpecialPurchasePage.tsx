import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import {
  Sunset,
  Calendar,
  Users,
  Clock,
  MapPin,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StripePaymentForm } from "./StripePaymentForm";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { useEditableContent } from "../lib/useEditableContent";

interface SunsetSpecialPurchasePageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

interface Booking {
  id: string;
  selectedDate: string;
  passengers: any[];
  contactInfo?: {
    name: string;
    email: string;
  };
  totalPrice?: number;
}

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function SunsetSpecialPurchasePage() {
  const { language, onNavigate } = useOutletContext<OutletContext>();
  const content = useEditableContent(language);
  const sunsetSpecial = content?.homepage?.sunsetSpecial;
  const SUNSET_SPECIAL_PRICE = sunsetSpecial?.price || 25;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<number | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    loadBookingData();
  }, []);

  useEffect(() => {
    if (booking && sunsetSpecial?.maxSeats) {
      checkSeatAvailability();
    }
  }, [booking, sunsetSpecial?.maxSeats]);

  const loadBookingData = async () => {
    try {
      const bookingId = sessionStorage.getItem(
        "sunset-special-booking-id",
      );

      if (!bookingId) {
        setError("No booking ID found. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fetch full booking details
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${encodeURIComponent(bookingId)}/full`,
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
        if (data.booking) {
          setBooking(data.booking);
        } else {
          setError("Booking not found. Please try again.");
        }
      } else {
        setError(
          "Unable to load booking details. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      setError(
        "Unable to load booking details. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkSeatAvailability = async () => {
    if (!booking) return;
    
    setIsCheckingAvailability(true);
    try {
      const dateOnly = booking.selectedDate.split('T')[0];
      const maxSeats = sunsetSpecial?.maxSeats || 8;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/sunset-special/availability/${dateOnly}?maxSeats=${maxSeats}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSeats(data.availableSeats);
        
        // Check if enough seats for this booking
        if (data.availableSeats < booking.passengers.length) {
          setError(`Sorry, only ${data.availableSeats} seat(s) available for the sunset special on this date.`);
        }
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleContinueToPayment = async () => {
    // Check availability one more time before payment
    if (availableSeats !== null && availableSeats < booking!.passengers.length) {
      toast.error(`Sorry, only ${availableSeats} seat(s) available. Please contact support.`);
      return;
    }

    setIsCreatingPayment(true);
    setIsCreatingPayment(true);

    try {
      // Create payment intent for sunset special add-on
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/create-payment-intent`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalPrice,
            customerEmail: booking!.contactInfo?.email,
            metadata: {
              bookingId: booking!.id,
              type: "sunset-special-addon",
              participants:
                booking!.passengers.length.toString(),
            },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShowPayment(true);
        } else {
          toast.error(
            "Failed to initialize payment. Please try again.",
          );
        }
      } else {
        const data = await response.json();
        toast.error(
          data.error ||
            "Failed to initialize payment. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast.error(
        "Failed to initialize payment. Please try again.",
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = async (
    paymentIntentId: string,
  ) => {
    setIsProcessing(true);

    try {
      // Update the booking to add sunset special
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${booking!.id}/add-sunset-special`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId,
            sunsetSpecialPrice: totalPrice,
            participants: booking!.passengers.length,
            maxSeats: sunsetSpecial?.maxSeats || 8,
            departureTime: sunsetSpecial?.departureTime || "6:00 PM",
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Clear session storage
        sessionStorage.removeItem("sunset-special-booking-id");
        sessionStorage.removeItem("sunset-special-active");

        toast.success("Sunset special added to your booking!");

        // Navigate to confirmation or booking details
        setTimeout(() => {
          onNavigate("home");
        }, 1500);
      } else {
        const data = await response.json();
        toast.error(
          data.error ||
            "Failed to update booking. Please contact support.",
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error(
        "Failed to update booking. Please contact support.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Booking not found"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => onNavigate("home")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const totalPrice =
    booking.passengers.length * SUNSET_SPECIAL_PRICE;
  const formattedDate = new Date(
    booking.selectedDate,
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => onNavigate("home")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl text-foreground">Add Sunset Special</h1>
          </div>
          <p className="text-muted-foreground">
            Enhance your Hop On Sintra experience with an exclusive sunset drive
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Existing Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Your Booking
                </CardTitle>
                <CardDescription>
                  Booking ID: {booking.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Date
                    </p>
                    <p className="font-medium">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Passengers
                    </p>
                    <p className="font-medium">
                      {booking.passengers.length}{" "}
                      {booking.passengers.length === 1
                        ? "person"
                        : "people"}
                    </p>
                  </div>
                </div>

                {booking.contactInfo && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Contact
                    </p>
                    <p className="font-medium">
                      {booking.contactInfo.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.contactInfo.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sunset Special Details */}
            <Card className="mt-6 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-orange-500" />
                  Sunset Special Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sunsetSpecial && (
                  <>
                    <p className="text-sm text-gray-700">
                      {sunsetSpecial.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Departure
                          </p>
                          <p className="text-sm font-medium">
                            {sunsetSpecial.departureTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Duration
                          </p>
                          <p className="text-sm font-medium">
                            {sunsetSpecial.duration}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {sunsetSpecial.images &&
                      sunsetSpecial.images[0] && (
                        <div className="rounded-lg overflow-hidden mt-4">
                          <ImageWithFallback
                            src={sunsetSpecial.images[0].url}
                            alt={sunsetSpecial.images[0].alt}
                            className="w-full h-40 object-cover"
                          />
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Add-On Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Sunset Special
                    </span>
                    <span>
                      €{SUNSET_SPECIAL_PRICE} per person
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      × {booking.passengers.length}{" "}
                      {booking.passengers.length === 1
                        ? "passenger"
                        : "passengers"}
                    </span>
                    <span>€{totalPrice}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    Total to Pay
                  </span>
                  <span className="text-2xl font-bold text-orange-600">
                    €{totalPrice}
                  </span>
                </div>

                {/* Seat Availability */}
                {availableSeats !== null && (
                  <Alert className={availableSeats >= booking.passengers.length ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <AlertDescription className={`text-sm ${availableSeats >= booking.passengers.length ? "text-green-900" : "text-red-900"}`}>
                      {availableSeats >= booking.passengers.length 
                        ? `✓ ${availableSeats} seat(s) available for this date`
                        : `⚠️ Only ${availableSeats} seat(s) available. You need ${booking.passengers.length}.`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900">
                    This will be added to your existing booking{" "}
                    {booking.id}
                  </AlertDescription>
                </Alert>

                {!showPayment && (
                  <Button
                    onClick={handleContinueToPayment}
                    disabled={isCreatingPayment || isCheckingAvailability || (availableSeats !== null && availableSeats < booking.passengers.length)}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isCheckingAvailability ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Checking Availability...
                      </>
                    ) : isCreatingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Preparing Payment...
                      </>
                    ) : availableSeats !== null && availableSeats < booking.passengers.length ? (
                      <>
                        Sold Out
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            {showPayment && clientSecret && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    Secure payment processed by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StripePaymentForm
                    amount={totalPrice}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => {
                      toast.error(error);
                    }}
                    customerEmail={booking.contactInfo?.email}
                  />
                </CardContent>
              </Card>
            )}

            {isProcessing && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">
                      Processing your booking...
                    </p>
                    <p className="text-sm text-orange-700">
                      Please wait while we update your
                      reservation
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What's Included */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              Important Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sunsetSpecial?.instructions ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {sunsetSpecial.instructions}
                </p>
              </div>
            ) : (
              <div className="text-gray-600 text-sm">
                <p>
                  Please arrive 10 minutes before departure time
                  at the Historical Center. Bring warm clothing
                  as it can be windy at the coast.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}