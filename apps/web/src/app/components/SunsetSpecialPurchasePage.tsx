import {useWebsiteText} from '../lib/translations/websiteText';
import { authenticatedFetch as fetch } from "@/lib/authenticatedFetch";
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
import { toast } from 'sonner';
import { useEditableContent } from "../lib/useEditableContent";
import { analytics } from "../lib/analytics";

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
  const wt = useWebsiteText();
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

  // Handle returning from a redirect-based payment method (PayPal, etc). The
  // reload that follows wipes showPayment/clientSecret state, so this finalizes the
  // add-on server-side from the data stashed when the payment intent was created,
  // independent of local component state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedPaymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    if (!returnedPaymentIntentId) return;

    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.hash,
    );

    if (redirectStatus !== "succeeded") {
      toast.error(wt("Payment was not completed. Please try again."));
      return;
    }

    (async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/finalize-addon-payment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentIntentId: returnedPaymentIntentId }),
          },
        );
        const data = await response.json();
        if (data.success) {
          sessionStorage.removeItem("sunset-special-booking-id");
          sessionStorage.removeItem("sunset-special-active");
          toast.success(wt("Sunset special added to your booking!"));
          setTimeout(() => onNavigate("home"), 1500);
        } else {
          console.error(
            "⚠️ CRITICAL: Sunset special payment succeeded via redirect but finalization failed",
          );
          console.error("⚠️ Payment Intent ID:", returnedPaymentIntentId);
          toast.error(
            wt("Your payment succeeded but we couldn't finish adding the sunset special automatically. Please contact us with your payment confirmation."),
            { duration: 15000 },
          );
        }
      } catch (err) {
        console.error("Error finalizing redirect sunset-special payment:", err);
        toast.error(
          wt("Your payment may have succeeded but we couldn't confirm it automatically. Please contact us with your payment confirmation."),
          { duration: 15000 },
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setError(wt("Booking not found"));
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
          setError(wt("Booking not found"));
        }
      } else {
        setError(
          wt("Failed to look up booking. Please try again."),
        );
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      setError(
        wt("Failed to look up booking. Please try again."),
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
          setError(wt("Only {available} places are available; your group needs {needed}.", {available: data.availableSeats, needed: booking.passengers.length}));
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
      toast.error(wt("Available places: {count}", {count: availableSeats ?? 0}));
      return;
    }

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
            // Stashed server-side so the add-on can still be completed if a
            // redirect-based payment method (PayPal, etc) reloads the page before
            // handlePaymentSuccess can run.
            pendingSunsetSpecialData: {
              bookingId: booking!.id,
              sunsetDate: booking!.selectedDate.split("T")[0],
              quantity: booking!.passengers.length,
              amount: totalPrice,
            },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShowPayment(true);
          analytics.checkoutStarted(totalPrice, booking!.passengers.length);
        } else {
          toast.error(
            wt("Payment could not be started. Please try again."),
          );
        }
      } else {
        const data = await response.json();
        toast.error(
          wt("Payment could not be started. Please try again."),
        );
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast.error(
        wt("Payment could not be started. Please try again."),
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
            sunsetDate: booking!.selectedDate.split("T")[0],
            quantity: booking!.passengers.length,
            amount: totalPrice,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Clear session storage
        sessionStorage.removeItem("sunset-special-booking-id");
        sessionStorage.removeItem("sunset-special-active");

        toast.success(wt("Sunset special added to your booking!"));
        analytics.sunsetSpecialPurchased(booking!.id, totalPrice, booking!.passengers.length);

        // Navigate to confirmation or booking details
        setTimeout(() => {
          onNavigate("home");
        }, 1500);
      } else {
        const data = await response.json();
        toast.error(
          wt("Booking failed. Please contact support with your payment confirmation."),
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error(
        wt("Booking failed. Please contact support with your payment confirmation."),
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
          <p className="text-gray-600">{wt("Loading booking details...")}</p>
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
              {error || wt("Booking not found")}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => onNavigate("home")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />{wt("Back to Home")}</Button>
        </div>
      </div>
    );
  }

  const totalPrice =
    booking.passengers.length * SUNSET_SPECIAL_PRICE;
  const formattedDate = new Date(
    booking.selectedDate,
  ).toLocaleDateString(language === 'pt' ? 'pt-PT' : language, {
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
            <ArrowLeft className="mr-2 h-4 w-4" />{wt("Back")}</Button>
          <div className="flex items-center gap-3 mb-2">
            <Sunset className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl text-foreground">{wt("Add Sunset Special")}</h1>
          </div>
          <p className="text-muted-foreground">{wt("Enhance your Hop On Sintra experience with an exclusive sunset drive")}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Existing Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{wt("Your Booking")}</CardTitle>
                <CardDescription>{wt("Booking ID:")}{booking.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{wt("Date")}</p>
                    <p className="font-medium">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{wt("Passengers")}</p>
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
                    <p className="text-sm text-gray-500">{wt("Contact")}</p>
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
                  <Sunset className="h-5 w-5 text-orange-500" />{wt("Sunset Special Details")}</CardTitle>
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
                          <p className="text-xs text-gray-500">{wt("Departure")}</p>
                          <p className="text-sm font-medium">
                            {sunsetSpecial.departureTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">{wt("Duration")}</p>
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
                <CardTitle className="text-lg">{wt("Add-On Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{wt("Sunset Special")}</span>
                    <span>
                      €{SUNSET_SPECIAL_PRICE}{wt("per person")}</span>
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
                  <span className="font-semibold">{wt("Total to Pay")}</span>
                  <span className="text-2xl font-bold text-orange-600">
                    €{totalPrice}
                  </span>
                </div>

                {/* Seat Availability */}
                {availableSeats !== null && (
                  <Alert className={availableSeats >= booking.passengers.length ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <AlertDescription className={`text-sm ${availableSeats >= booking.passengers.length ? "text-green-900" : "text-red-900"}`}>
                      {availableSeats >= booking.passengers.length 
                        ? wt("Available places: {count}", {count: availableSeats})
                        : wt("Only {available} places are available; your group needs {needed}.", {available: availableSeats, needed: booking.passengers.length})
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900">{wt("This will be added to your existing booking")}{" "}
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
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />{wt("Checking Availability...")}</>
                    ) : isCreatingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />{wt("Preparing Payment...")}</>
                    ) : availableSeats !== null && availableSeats < booking.passengers.length ? (
                      <>{wt("Sold Out")}</>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />{wt("Continue to Payment")}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            {showPayment && clientSecret && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">{wt("Payment Details")}</CardTitle>
                  <CardDescription>{wt("Secure payment processed by Stripe")}</CardDescription>
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
                    <p className="font-medium text-orange-900">{wt("Processing your booking...")}</p>
                    <p className="text-sm text-orange-700">{wt("Please wait while we update your reservation")}</p>
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
              <CheckCircle className="h-5 w-5 text-orange-600" />{wt("Important Instructions")}</CardTitle>
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
                <p>{wt("Please arrive 10 minutes before departure time at the Historical Center. Bring warm clothing as it can be windy at the coast.")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}