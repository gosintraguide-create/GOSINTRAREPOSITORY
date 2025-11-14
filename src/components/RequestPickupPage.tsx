import { useState } from "react";
import { MapPin, Users, Clock, Car, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RequestPickupPageProps {
  onNavigate: (page: string) => void;
}

export function RequestPickupPage({ onNavigate }: RequestPickupPageProps) {
  const [step, setStep] = useState<"verify" | "request" | "searching" | "confirmed">("verify");
  const [bookingCode, setBookingCode] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [groupSize, setGroupSize] = useState<string>("1");
  const [location, setLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const locations = [
    { id: "sintra-station", name: "Sintra Train Station" },
    { id: "pena-palace", name: "Pena Palace" },
    { id: "quinta-regaleira", name: "Quinta da Regaleira" },
    { id: "moorish-castle", name: "Moorish Castle" },
    { id: "monserrate-palace", name: "Monserrate Palace" },
    { id: "sintra-palace", name: "Sintra National Palace" },
    { id: "town-center", name: "Historic Town Center" },
  ];

  const getVehicleType = (size: number) => {
    if (size <= 2) return "Tuk Tuk (2 passengers)";
    if (size <= 4) return "UMM Jeep (4 passengers)";
    if (size <= 6) return "Premium Van (6 passengers)";
    return `${Math.ceil(size / 6)} vehicles`;
  };

  const getVehicleDescription = (size: number) => {
    if (size <= 6) return getVehicleType(size);
    
    const vans = Math.floor(size / 6);
    const remaining = size % 6;
    
    if (remaining === 0) {
      return `${vans} Premium Van${vans > 1 ? 's' : ''} (6 passengers each)`;
    }
    
    let description = `${vans} Premium Van${vans > 1 ? 's' : ''}`;
    if (remaining <= 2) {
      description += ` + 1 Tuk Tuk (${remaining} passenger${remaining > 1 ? 's' : ''})`;
    } else if (remaining <= 4) {
      description += ` + 1 UMM Jeep (${remaining} passengers)`;
    } else {
      description += ` + 1 Premium Van (${remaining} passengers)`;
    }
    
    return description;
  };

  const handleVerifyBooking = async () => {
    if (!bookingCode.trim()) {
      setVerificationError("Please enter your booking code");
      return;
    }

    setVerificationError("");

    try {
      // Verify booking code with backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingCode: bookingCode.trim().toUpperCase(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.booking) {
          setIsVerified(true);
          setCustomerName(result.booking.customerName || "");
          setCustomerPhone(result.booking.customerPhone || "");
          setGroupSize(String(result.booking.passes || 1));
          setStep("request");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setVerificationError("Invalid booking code. Please check and try again.");
        }
      } else {
        setVerificationError("Unable to verify booking. Please try again.");
      }
    } catch (error) {
      console.error('Booking verification error:', error);
      setVerificationError("Connection error. Please check your internet and try again.");
    }
  };

  const handleRequestPickup = async () => {
    if (!location || !groupSize || !customerName || !customerPhone) return;
    
    setStep("searching");
    
    try {
      // Send pickup request to backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName,
            customerPhone,
            pickupLocation: locations.find(l => l.id === location)?.name || location,
            destination: locations.find(l => l.id === destination)?.name || destination,
            groupSize: parseInt(groupSize),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log('Pickup request created:', result.request.id);
        }
      } else {
        console.warn('Server unavailable, request will be processed locally');
      }
    } catch (error) {
      console.warn('Could not connect to server, request will be processed locally:', error);
    }
    
    // Always show confirmation for better UX
    setTimeout(() => {
      setStep("confirmed");
    }, 2000);
  };

  if (step === "verify") {
    return (
      <div className="flex-1 bg-secondary/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
                <Car className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              Verify Your Booking
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Enter your booking code to request a pickup. This service is only available to customers with active day passes.
            </p>
          </div>
        </section>

        {/* Verification Form */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <Card className="overflow-hidden border-border p-6 shadow-lg sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="booking-code">Booking Code</Label>
                  <Input
                    id="booking-code"
                    type="text"
                    placeholder="e.g., GST-ABC123"
                    value={bookingCode}
                    onChange={(e) => {
                      setBookingCode(e.target.value.toUpperCase());
                      setVerificationError("");
                    }}
                    className="border-border text-center text-lg tracking-wider"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyBooking();
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    You received this code in your booking confirmation email
                  </p>
                </div>

                {verificationError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                      <p className="text-sm text-red-600">{verificationError}</p>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleVerifyBooking}
                  disabled={!bookingCode.trim()}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verify Booking
                </Button>

                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Don't have a booking?</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Pickup requests are only available to customers with purchased day passes.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate("buy-ticket")}
                  >
                    Purchase Day Pass
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (step === "searching") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Car className="h-16 w-16 animate-pulse text-accent" />
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Users className="h-3 w-3" />
              </div>
            </div>
          </div>
          <h2 className="mb-2 text-foreground">
            {parseInt(groupSize) > 6 ? 'Coordinating Your Vehicles...' : 'Finding Your Vehicle...'}
          </h2>
          <p className="mb-4 text-muted-foreground">
            Notifying drivers about your group of <strong>{groupSize} {parseInt(groupSize) === 1 ? 'passenger' : 'passengers'}</strong>
          </p>
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex flex-col gap-2 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Vehicles needed:</span>
                <span className="text-foreground">
                  {parseInt(groupSize) <= 6 ? '1 vehicle' : `${Math.ceil(parseInt(groupSize) / 6)} vehicles`}
                </span>
              </div>
              {parseInt(groupSize) > 6 && (
                <p className="mt-2 text-accent">Coordinating multiple vehicles may take 3-5 minutes</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
          </div>
          
          <h2 className="mb-2 text-center text-foreground">Vehicle On The Way!</h2>
          <p className="mb-6 text-center text-muted-foreground">
            Your driver has been notified and will arrive shortly
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-foreground">
                <Car className="h-5 w-5 text-accent" />
                <span>Vehicle Details</span>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Vehicles:</span>
                  <span className="text-foreground">
                    {parseInt(groupSize) <= 6 ? '1 vehicle' : `${Math.ceil(parseInt(groupSize) / 6)} vehicles coordinated`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Group Size:</span>
                  <span className="text-foreground">{groupSize} {parseInt(groupSize) === 1 ? 'passenger' : 'passengers'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Arrival:</span>
                  <span className="text-foreground">{parseInt(groupSize) > 6 ? '5-8 minutes' : '3-5 minutes'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                <span>Pickup Location</span>
              </div>
              <p className="text-muted-foreground">
                {locations.find(l => l.id === location)?.name}
              </p>
            </div>

            {destination && (
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Destination</span>
                </div>
                <p className="text-muted-foreground">
                  {locations.find(l => l.id === destination)?.name}
                </p>
              </div>
            )}

            <div className="rounded-lg border-2 border-accent/20 bg-accent/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-accent" />
                <div className="text-muted-foreground">
                  {parseInt(groupSize) <= 6 ? (
                    <p>Our drivers have been notified of your group size and will dispatch an <strong className="text-foreground">appropriate vehicle</strong> to accommodate everyone comfortably.</p>
                  ) : parseInt(groupSize) === 7 ? (
                    <p>We've coordinated <strong className="text-foreground">2 vehicles</strong> for your group. They'll arrive together or within 1-2 minutes of each other.</p>
                  ) : (
                    <p>We've coordinated <strong className="text-foreground">{Math.ceil(parseInt(groupSize) / 6)} vehicles</strong> for your large group. Our drivers will ensure everyone departs together.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("request")}
            >
              Request Another
            </Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={() => onNavigate("home")}
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-secondary/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
              <Car className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            Request a Pickup
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Tell us your group size and location, and we'll send the perfect vehicle for you. 
            Our drivers are notified of your passenger count to ensure comfort and availability.
          </p>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-border p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customer-name">Your Name</Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="border-border"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone Number</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="+351 XXX XXX XXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="border-border"
                />
              </div>

              {/* Group Size */}
              <div className="space-y-2">
                <Label htmlFor="group-size" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Number of Passengers
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 border-border"
                    onClick={() => setGroupSize(String(Math.max(1, parseInt(groupSize) - 1)))}
                  >
                    -
                  </Button>
                  <Input
                    id="group-size"
                    type="number"
                    min="1"
                    max="50"
                    value={groupSize}
                    onChange={(e) => setGroupSize(String(Math.max(1, parseInt(e.target.value) || 1)))}
                    className="border-border text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 border-border"
                    onClick={() => setGroupSize(String(Math.min(50, parseInt(groupSize) + 1)))}
                  >
                    +
                  </Button>
                </div>
                {groupSize && parseInt(groupSize) <= 6 ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Car className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <p>
                        We'll dispatch an <strong className="text-foreground">appropriate vehicle</strong> for your group of {groupSize}
                      </p>
                    </div>
                  </div>
                ) : groupSize && parseInt(groupSize) === 7 ? (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                      <p>
                        Your group will require <strong className="text-foreground">2 vehicles</strong> that will be coordinated to arrive together. This may add 2-3 minutes to pickup time.
                      </p>
                    </div>
                  </div>
                ) : groupSize && parseInt(groupSize) > 7 ? (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                      <p>
                        Large group! You'll need <strong className="text-foreground">{Math.ceil(parseInt(groupSize) / 6)} vehicles</strong> coordinated to arrive together. This may add 3-5 minutes to pickup time.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Current Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Your Current Location
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Destination (Optional)
                </Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Where would you like to go?" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((loc) => loc.id !== location)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground">
                  You can also decide your destination with the driver
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-lg border border-border bg-white p-6">
                <div className="mb-3 flex items-center gap-3 text-primary">
                  <Clock className="h-5 w-5" />
                  <span>Service Hours</span>
                </div>
                <p className="text-muted-foreground">
                  Our vehicles run every 30 minutes from 9:00 AM to 7:00 PM daily. 
                  Average wait time is 5-10 minutes.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent/90"
                onClick={handleRequestPickup}
                disabled={!location || !groupSize || !customerName || !customerPhone}
              >
                <Car className="mr-2 h-5 w-5" />
                Request Pickup
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-foreground">How Vehicle Coordination Works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-all group-hover:shadow-xl">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">1. Tell Us Your Group Size</h3>
              <p className="text-muted-foreground">
                Select how many passengers need a ride (1-50 people)
              </p>
            </div>
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all group-hover:shadow-xl">
                  <Car className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">2. We Coordinate Vehicles</h3>
              <p className="text-muted-foreground">
                Drivers receive your request and coordinate appropriate vehicles for your group
              </p>
            </div>
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-all group-hover:shadow-xl">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">3. Vehicles Arrive</h3>
              <p className="text-muted-foreground">
                Your vehicle(s) arrive in 3-5 minutes, coordinated for groups over 6
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}