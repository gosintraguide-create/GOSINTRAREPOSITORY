import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
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
  Banknote,
  CreditCard,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface SellTicketsFormProps {
  driverId: string;
  onSaleComplete: () => void;
}

interface AvailabilitySettings {
  [timeSlot: string]: number;
}

interface PricingSettings {
  basePrice: number;
  childPrice: number;
  guidedTourSurcharge: number;
}

export function SellTicketsForm({
  driverId,
  onSaleComplete,
}: SellTicketsFormProps) {
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card"
  >("cash");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [timeSlot, setTimeSlot] = useState("");
  const [pickupLocation, setPickupLocation] = useState(
    "sintra-train-station",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] =
    useState<AvailabilitySettings>({});
  const [loadingAvailability, setLoadingAvailability] =
    useState(false);
  const [pricing, setPricing] = useState<PricingSettings>({
    basePrice: 20,
    childPrice: 12,
    guidedTourSurcharge: 5,
  });

  const TICKET_PRICE = pricing.basePrice;
  const totalAmount = numberOfPeople * TICKET_PRICE;

  const TIME_SLOTS = [
    { value: "9:00", label: "9:00 AM", isGuided: false },
    { value: "10:00", label: "10:00 AM", isGuided: true },
    { value: "11:00", label: "11:00 AM", isGuided: false },
    { value: "12:00", label: "12:00 PM", isGuided: false },
    { value: "13:00", label: "1:00 PM", isGuided: false },
    { value: "14:00", label: "2:00 PM", isGuided: true },
    { value: "15:00", label: "3:00 PM", isGuided: false },
    { value: "16:00", label: "4:00 PM", isGuided: false },
  ];

  const PICKUP_LOCATIONS = [
    {
      value: "sintra-train-station",
      label: "Sintra Train Station",
    },
    {
      value: "sintra-town-center",
      label: "Sintra Town Center",
    },
    { value: "pena-palace", label: "Pena Palace" },
    { value: "quinta-regaleira", label: "Quinta da Regaleira" },
    { value: "moorish-castle", label: "Moorish Castle" },
    { value: "monserrate-palace", label: "Monserrate Palace" },
    { value: "sintra-palace", label: "Sintra National Palace" },
    { value: "other", label: "Other Location" },
  ];

  // Load pricing from backend
  useEffect(() => {
    async function loadPricing() {
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
              basePrice: data.pricing.basePrice || 20,
              childPrice: data.pricing.childPrice || 12,
              guidedTourSurcharge:
                data.pricing.guidedTourSurcharge || 5,
            });
          }
        }
      } catch (error) {
        console.error("Error loading pricing:", error);
      }
    }

    loadPricing();
  }, []);

  // Load availability when date changes
  useEffect(() => {
    async function loadAvailability() {
      if (!selectedDate) return;

      setLoadingAvailability(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability/${selectedDate}`,
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
            setAvailability(data.availability);
          }
        }
      } catch (error) {
        console.error("Error loading availability:", error);
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (numberOfPeople < 1) {
      toast.error("Please select at least 1 person");
      return;
    }

    if (!timeSlot) {
      toast.error("Please select a time slot");
      return;
    }

    if (!pickupLocation) {
      toast.error("Please select a pickup location");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the ticket sale
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/driver-sales/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            driverId,
            numberOfPeople,
            customerEmail,
            paymentMethod,
            amount: totalAmount,
            timeSlot,
            pickupLocation,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Sale created successfully! ${numberOfPeople} ticket${numberOfPeople > 1 ? "s" : ""} sold for €${totalAmount.toFixed(2)}`,
          {
            description: `Confirmation email sent to ${customerEmail}`,
            duration: 5000,
          },
        );

        // Reload availability to reflect the updated seat count
        const availabilityResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability/${selectedDate}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (availabilityResponse.ok) {
          const availabilityData =
            await availabilityResponse.json();
          if (availabilityData.availability) {
            setAvailability(availabilityData.availability);
          }
        }

        // Reset form
        setNumberOfPeople(1);
        setCustomerEmail("");
        setPaymentMethod("cash");
        setTimeSlot("");
        setPickupLocation("sintra-train-station");

        // Notify parent to refresh metrics
        onSaleComplete();
      } else {
        toast.error("Failed to create sale", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Error creating sale", {
        description:
          "Please check your connection and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Ticket Sale
        </CardTitle>
        <CardDescription>
          Sell day pass tickets and send confirmation emails to
          customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Number of People */}
          <div>
            <Label
              htmlFor="numberOfPeople"
              className="text-base"
            >
              Number of People
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setNumberOfPeople(
                    Math.max(1, numberOfPeople - 1),
                  )
                }
                disabled={numberOfPeople <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[80px]">
                <div className="text-3xl font-bold">
                  {numberOfPeople}
                </div>
                <div className="text-sm text-gray-500">
                  {numberOfPeople === 1 ? "person" : "people"}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setNumberOfPeople(numberOfPeople + 1)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Customer Email */}
          <div>
            <Label htmlFor="customerEmail">
              Customer Email
            </Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tickets will be sent to this email address
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base">Payment Method</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "cash"
                    ? "border-[#0A4D5C] bg-[#0A4D5C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Banknote
                    className={`h-8 w-8 ${paymentMethod === "cash" ? "text-[#0A4D5C]" : "text-gray-400"}`}
                  />
                  <span className="font-medium">Cash</span>
                  {paymentMethod === "cash" && (
                    <CheckCircle className="h-4 w-4 text-[#0A4D5C]" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "card"
                    ? "border-[#0A4D5C] bg-[#0A4D5C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard
                    className={`h-8 w-8 ${paymentMethod === "card" ? "text-[#0A4D5C]" : "text-gray-400"}`}
                  />
                  <span className="font-medium">Card</span>
                  {paymentMethod === "card" && (
                    <CheckCircle className="h-4 w-4 text-[#0A4D5C]" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label
              htmlFor="selectedDate"
              className="text-base flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4 text-[#0A4D5C]" />
              Date
            </Label>
            <Input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Time Slot */}
          <div>
            <Label className="text-base flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-[#0A4D5C]" />
              Time Slot
            </Label>

            {/* Availability Summary */}
            {!loadingAvailability && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      Selling {numberOfPeople} ticket
                      {numberOfPeople > 1 ? "s" : ""}
                    </p>
                    <p className="text-blue-700 mt-1">
                      Time slots show available seats. Select a
                      time with enough capacity.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TIME_SLOTS.map((slot) => {
                const seats = availability[slot.value] ?? 50;
                const isSoldOut = seats === 0;
                const hasEnoughSeats = seats >= numberOfPeople;
                const isLowAvailability =
                  seats < 10 && seats > 0;
                const isSelected = timeSlot === slot.value;

                // Determine availability color
                let availabilityColor =
                  "bg-green-100 text-green-700";
                if (seats === 0) {
                  availabilityColor = "bg-red-100 text-red-700";
                } else if (seats < 10) {
                  availabilityColor =
                    "bg-orange-100 text-orange-700";
                } else if (seats < 20) {
                  availabilityColor =
                    "bg-yellow-100 text-yellow-700";
                }

                return (
                  <div key={slot.value} className="relative">
                    {/* Guided Tour Badge */}
                    {slot.isGuided && !isSoldOut && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A4D5C] text-white text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap z-10">
                        INSIGHT
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (hasEnoughSeats && !isSoldOut) {
                          setTimeSlot(slot.value);
                        } else if (
                          !hasEnoughSeats &&
                          !isSoldOut
                        ) {
                          toast.error(
                            `Only ${seats} seats available`,
                            {
                              description: `You need ${numberOfPeople} seats for this sale.`,
                            },
                          );
                        }
                      }}
                      disabled={
                        !hasEnoughSeats || loadingAvailability
                      }
                      className={`
                        w-full rounded-lg transition-all border-2 relative overflow-hidden
                        ${slot.isGuided && !isSoldOut ? "pb-6" : "pb-8"}
                        ${
                          isSelected
                            ? "border-[#D97843] bg-[#D97843] text-white shadow-lg scale-105"
                            : !hasEnoughSeats
                              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                              : "border-gray-300 bg-white hover:border-[#0A4D5C] hover:shadow-md"
                        }
                      `}
                    >
                      <div className="p-3">
                        <div className="font-bold text-base mb-1">
                          {slot.label}
                        </div>
                        {slot.isGuided && !isSoldOut && (
                          <div className="text-xs opacity-90">
                            +€{pricing.guidedTourSurcharge}
                          </div>
                        )}
                      </div>

                      {/* Availability Bar at Bottom */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${availabilityColor} px-2 py-1 text-center`}
                      >
                        <div className="text-xs font-semibold">
                          {isSoldOut
                            ? "SOLD OUT"
                            : !hasEnoughSeats
                              ? `Only ${seats} left`
                              : seats < 20
                                ? `${seats} seats left`
                                : `${seats} available`}
                        </div>
                      </div>

                      {/* Not Enough Seats Indicator */}
                      {!hasEnoughSeats && !isSoldOut && (
                        <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center pointer-events-none">
                          <AlertCircle className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            {loadingAvailability && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading availability...
              </p>
            )}
            {timeSlot && !loadingAvailability && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    {TIME_SLOTS.find(
                      (s) => s.value === timeSlot,
                    )?.isGuided ? (
                      <p className="font-medium text-green-900">
                        ✨ Includes guided commentary -
                        storytelling tour of Sintra
                      </p>
                    ) : (
                      <p className="text-green-700">
                        When the customer will start using the
                        pass
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pickup Location */}
          <div>
            <Label
              htmlFor="pickupLocation"
              className="text-base flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-[#0A4D5C]" />
              First Pickup Location
            </Label>
            <Select
              value={pickupLocation}
              onValueChange={(value) =>
                setPickupLocation(value)
              }
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select pickup location" />
              </SelectTrigger>
              <SelectContent>
                {PICKUP_LOCATIONS.map((location) => (
                  <SelectItem
                    key={location.value}
                    value={location.value}
                  >
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Where the customer will board first
            </p>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-[#0A4D5C]">
                €{totalAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {numberOfPeople} × €{TICKET_PRICE.toFixed(2)} per
              person
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#D97843] hover:bg-[#D97843]/90 text-white py-6 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Sale...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Complete Sale & Send Tickets
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}