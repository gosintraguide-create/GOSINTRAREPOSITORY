import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Calendar, Download, MapPin, Users, Clock, CheckCircle2, QrCode, Car, Mail, Phone, User, ArrowLeft } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { TicketCard } from "./TicketCard";

interface ManageBookingPageProps {
  onNavigate: (page: string) => void;
}

export function ManageBookingPage({ onNavigate }: ManageBookingPageProps) {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  const handleLookup = async () => {
    if (!bookingId.trim() || !email.trim()) {
      toast.error("Please enter both booking ID and email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/lookup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingId.trim().toUpperCase(),
            email: email.trim(),
          }),
        }
      );

      const result = await response.json();
      
      if (result.success && result.booking) {
        setBooking(result.booking);
        toast.success("Booking found!");
        // Save to session for easy access
        sessionStorage.setItem("currentBooking", JSON.stringify(result.booking));
      } else {
        toast.error(result.error || "Booking not found");
      }
    } catch (error) {
      console.error("Error looking up booking:", error);
      toast.error("Failed to look up booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${booking.id}/pdf`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GoSintra_Tickets_${booking.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Tickets downloaded!");
      } else {
        toast.error("Failed to download tickets");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download tickets");
    }
  };

  const handleRequestPickup = () => {
    // Save booking to session and navigate to request pickup
    if (booking) {
      sessionStorage.setItem("pickupBooking", JSON.stringify(booking));
    }
    onNavigate("request-pickup");
  };

  const handleLogout = () => {
    setBooking(null);
    setBookingId("");
    setEmail("");
    sessionStorage.removeItem("currentBooking");
    toast.success("Logged out successfully");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if booking is for today
  const isToday = (dateString: string) => {
    const bookingDate = new Date(dateString).toDateString();
    const today = new Date().toDateString();
    return bookingDate === today;
  };

  // Check if booking is in the future
  const isFuture = (dateString: string) => {
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  };

  if (!booking) {
    // Login Form
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 sm:py-20">
        <div className="mx-auto max-w-md px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate("home")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          <Card className="border-border p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-2 text-foreground">Manage Your Booking</h1>
              <p className="text-muted-foreground">
                Enter your booking details to view tickets and manage your reservation
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input
                  id="bookingId"
                  type="text"
                  placeholder="AA-1234"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                  className="mt-1 border-border"
                  onKeyPress={(e) => e.key === "Enter" && handleLookup()}
                />

              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border-border"
                  onKeyPress={(e) => e.key === "Enter" && handleLookup()}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The email used when booking
                </p>
              </div>

              <Button
                onClick={handleLookup}
                disabled={loading || !bookingId.trim() || !email.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Looking up...
                  </>
                ) : (
                  "View My Booking"
                )}
              </Button>
            </div>

            <div className="mt-6 rounded-lg bg-secondary/50 p-4">
              <h3 className="mb-2 text-sm text-foreground">Where to find your Booking ID?</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• In your booking confirmation email</li>
                <li>• At the top of your PDF tickets</li>
                <li>• In the booking confirmation page</li>
              </ul>
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help?{" "}
                <button
                  onClick={() => onNavigate("about")}
                  className="text-primary hover:underline"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Booking Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-foreground">Your Booking</h1>
            <p className="text-muted-foreground">
              Booking ID: <span className="font-mono text-lg text-primary">{booking.id}</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Status Badge */}
        {isToday(booking.selectedDate) && (
          <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-green-900">Your pass is valid TODAY!</p>
                <p className="text-sm text-green-700">Enjoy your day exploring Sintra</p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
          >
            <Download className="h-6 w-6 text-primary" />
            <span>Download Tickets</span>
          </Button>

          {isFuture(booking.selectedDate) && (
            <Button
              onClick={handleRequestPickup}
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
            >
              <Car className="h-6 w-6 text-primary" />
              <span>Request Pickup</span>
            </Button>
          )}

          <Button
            onClick={() => onNavigate("about")}
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
          >
            <Phone className="h-6 w-6 text-primary" />
            <span>Contact Support</span>
          </Button>
        </div>

        {/* Booking Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date & Time */}
            <Card className="border-border p-6">
              <h2 className="mb-4 flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Date & Time
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Date</p>
                  <p className="text-foreground">{formatDate(booking.selectedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Time</p>
                  <p className="text-foreground">{booking.timeSlot}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operating Hours</p>
                  <p className="text-foreground">9:00 AM - 8:00 PM</p>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="border-border p-6">
              <h2 className="mb-4 flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{booking.contactInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{booking.contactInfo.email}</span>
                </div>
                {booking.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{booking.contactInfo.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Booking Summary */}
            <Card className="border-border p-6">
              <h2 className="mb-4 flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Booking Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="text-foreground">{booking.passengers.length}</span>
                </div>
                {booking.guidedTour && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guided Commentary</span>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                )}
                {booking.selectedAttractions && booking.selectedAttractions.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Attraction Tickets</p>
                    <ul className="space-y-1">
                      {booking.selectedAttractions.map((attr: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {attr.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-foreground">Total Paid</span>
                  <span className="text-lg text-primary">€{booking.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Tickets */}
          <div className="space-y-6">
            <Card className="border-border p-6">
              <h2 className="mb-4 flex items-center gap-2 text-foreground">
                <QrCode className="h-5 w-5 text-primary" />
                Your Day Pass Tickets
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Show these tickets when boarding. Each passenger needs their own ticket.
              </p>

              <div className="space-y-8">
                {booking.passengers.map((passenger: any, index: number) => (
                  <TicketCard
                    key={index}
                    bookingId={booking.id}
                    passengerName={passenger.name}
                    passengerType={passenger.type}
                    date={booking.selectedDate}
                    timeSlot={booking.timeSlot}
                    qrCode={booking.qrCodes?.[index] || ""}
                    passengerNumber={index + 1}
                    totalPassengers={booking.passengers.length}
                  />
                ))}
              </div>

              <Button
                onClick={handleDownloadPDF}
                className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Tickets (PDF)
              </Button>
            </Card>

            {/* Pickup Location Reminder */}
            {isFuture(booking.selectedDate) && (
              <Card className="border-border p-6">
                <h2 className="mb-4 flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  Pickup Information
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Our vehicles operate at all major attractions in Sintra. Board at any location:
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    Pena Palace
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    Quinta da Regaleira
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    Moorish Castle
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    Sintra Town Center
                  </li>
                </ul>

                {isToday(booking.selectedDate) && (
                  <Button
                    onClick={handleRequestPickup}
                    className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Request Pickup Now
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Important Information */}
        <Card className="mt-6 border-border p-6">
          <h2 className="mb-4 text-foreground">Important Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <p className="mb-1 text-foreground">Service Hours</p>
                <p className="text-sm text-muted-foreground">
                  9:00 AM - 8:00 PM daily. Pickups every 10-15 minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <QrCode className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <p className="mb-1 text-foreground">Digital Tickets</p>
                <p className="text-sm text-muted-foreground">
                  Show your QR code from this page or your PDF tickets when boarding.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <p className="mb-1 text-foreground">Guaranteed Seating</p>
                <p className="text-sm text-muted-foreground">
                  Your seats are reserved. No need to worry about availability.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <p className="mb-1 text-foreground">Hop On/Off</p>
                <p className="text-sm text-muted-foreground">
                  Unlimited rides. Board and exit at any stop as many times as you like.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
