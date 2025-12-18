import { useState, useEffect } from "react";
import { CheckCircle, Download, Mail, Calendar, Users, ArrowRight, Printer, AlertCircle, FileDown, Ticket, Home, Settings, LogIn, Car, MessageCircle, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { TicketCard } from "./TicketCard";
import { getTranslation } from "../lib/translations";
import { getSession } from "../lib/sessionManager";
import { getComponentTranslation } from "../lib/translations/component-translations";

interface BookingConfirmationPageProps {
  onNavigate: (page: string) => void;
  booking: any;
  language?: string;
}

export function BookingConfirmationPage({ onNavigate, booking, language = "en" }: BookingConfirmationPageProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const t = getComponentTranslation(language);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Simulate email sent status
    setTimeout(() => setEmailSent(true), 1000);

    // Check if user is logged in
    const session = getSession();
    setIsLoggedIn(!!session);
  }, [booking]);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${booking.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('PDF download error:', errorData);
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const bookingIdShort = booking.id.split('_')[1] || booking.id;
      link.download = `HopOnSintra_Tickets_${bookingIdShort}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t.bookingConfirmation.pdfDownloadSuccess);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t.bookingConfirmation.pdfDownloadError);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container px-4 text-center">
          <p>{t.bookingConfirmation.noBookingFound}</p>
          <Button onClick={() => onNavigate("buy-ticket")} className="mt-4 bg-accent hover:bg-accent/90">
            <Ticket className="mr-2 h-5 w-5" />
            {t.bookingConfirmation.bookNow}
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(booking.selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const bookingIdShort = booking.id.split('_')[1] || booking.id;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = (qrCode: string, passengerName: string) => {
    const link = document.createElement('a');
    link.download = `hoponsintra-qr-${passengerName.replace(/\s/g, '-')}.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background py-12">
      <div className="mx-auto max-w-4xl px-4">
        
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mb-2">{t.bookingConfirmation.bookingConfirmed}</h1>
          <p className="mb-4 text-muted-foreground">
            {t.bookingConfirmation.checkEmail}
          </p>
          
          {/* Booking ID Badge */}
          <div className="mx-auto inline-block rounded-lg bg-primary/10 px-6 py-3">
            <p className="text-sm text-muted-foreground">{t.bookingConfirmation.bookingId}</p>
            <p className="text-2xl font-mono font-bold text-primary">{booking.id}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.bookingConfirmation.saveForManaging}</p>
          </div>
        </div>

        {/* Email Status */}
        {emailSent && (
          <Card className="mb-6 border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {t.bookingConfirmation.emailSentTo} {booking.contactInfo.email}
                </p>
                <p className="text-green-700">
                  {t.bookingConfirmation.ticketsSentToEmail}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Login Prompt for non-logged-in users */}
        {!isLoggedIn && (
          <Card className="mb-6 border-accent bg-gradient-to-br from-accent/10 to-accent/5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                  <LogIn className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-accent-foreground">🚀 {t.bookingConfirmation.unlockFullAccess}</h3>
                  <p className="mb-3 text-muted-foreground">
                    {t.bookingConfirmation.loginNow}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-accent" />
                      <span><strong>{t.bookingConfirmation.requestPickup}</strong> {t.bookingConfirmation.requestPickupDesc}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-accent" />
                      <span><strong>{t.bookingConfirmation.liveChatSupport}</strong> {t.bookingConfirmation.liveChatSupportDesc}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span><strong>{t.bookingConfirmation.viewTickets}</strong> {t.bookingConfirmation.viewTicketsDesc}</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t.bookingConfirmation.loginInstantly.split('{bold}')[0]}
                    <strong className="text-accent-foreground">{t.bookingConfirmation.loginInstantly.split('{bold}')[1].split('{/bold}')[0]}</strong>
                    {t.bookingConfirmation.loginInstantly.split('{/bold}')[1].split('{bold}')[0]}
                    <strong className="text-accent-foreground">{t.bookingConfirmation.loginInstantly.split('{bold}')[2].split('{/bold}')[0]}</strong>
                    {t.bookingConfirmation.loginInstantly.split('{/bold}')[2]}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  size="lg"
                  onClick={() => onNavigate("login")}
                  className="w-full gap-2 bg-accent hover:bg-accent/90 md:w-auto"
                >
                  <LogIn className="h-5 w-5" />
                  {t.bookingConfirmation.loginNowButton}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Booking Summary */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-primary">{t.bookingConfirmation.bookingSummary}</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {t.bookingConfirmation.booking} #{bookingIdShort}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t.bookingConfirmation.date}</p>
                <p className="text-muted-foreground">{formattedDate}</p>
                <p className="text-muted-foreground">9:00 AM - 7:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t.bookingConfirmation.passengers}</p>
                <p className="text-muted-foreground">
                  {booking.passengers.length} {booking.passengers.length === 1 ? t.bookingConfirmation.person : t.bookingConfirmation.people}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.bookingConfirmation.totalPaid}</p>
              <p className="text-primary">€{booking.totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Insight Tour Pickup Information */}
        {booking.guidedTour && (
          <Alert className="mb-6 border-secondary bg-secondary/10">
            <Car className="h-5 w-5 text-secondary" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-secondary text-lg">🌟 {t.bookingConfirmation.insightTourPickup}</p>
                <p className="text-foreground">
                  <strong>{t.bookingConfirmation.departsAt} {new Date(booking.selectedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</strong>
                </p>
                <p className="text-foreground">
                  <strong>📍 {t.bookingConfirmation.meetingPoint}:</strong> Historical Center of Sintra (downtown area near the main square)
                </p>
                <p className="text-foreground">
                  <strong>⏰ {t.bookingConfirmation.arriveEarly}</strong> {t.bookingConfirmation.lookForVehicle}
                </p>
                <p className="text-sm text-muted-foreground italic mt-2">
                  💡 This information is also included in your PDF ticket attachment and confirmation email.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tickets */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-primary">{t.bookingConfirmation.yourDayPassTickets}</h2>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="bg-primary hover:bg-primary/90"
              >
                {downloadingPdf ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-spin" />
                    {t.bookingConfirmation.downloading}
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t.bookingConfirmation.downloadPDF}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                {t.bookingConfirmation.printAll}
              </Button>
            </div>
          </div>

          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <FileDown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>📎 {t.bookingConfirmation.pdfTicketsAttached}</strong><br/>
              {t.bookingConfirmation.pdfTicketsAttachedDesc}
            </AlertDescription>
          </Alert>

          <div className="mb-6 rounded-lg bg-accent/10 p-4">
            <p className="font-medium text-accent-foreground">
              🎫 {t.bookingConfirmation.ticketsReady}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t.bookingConfirmation.ticketsReadyDesc}
            </p>
          </div>

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
                totalPrice={index === 0 ? booking.totalPrice : undefined}
                passengerNumber={index + 1}
                totalPassengers={booking.passengers.length}
              />
            ))}
          </div>
        </div>

        {/* Profile Access Tip - only show if already logged in */}
        {isLoggedIn && (
          <Card className="mb-6 border-accent/30 bg-accent/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-accent-foreground">✅ {t.bookingConfirmation.youreLoggedIn}</h3>
                <p className="text-muted-foreground">
                  {t.bookingConfirmation.fullAccessEnabled}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate("request-pickup")}
                    className="gap-2"
                  >
                    <Car className="h-4 w-4" />
                    {t.bookingConfirmation.requestPickupFrom}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* How to Use */}
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-primary">{t.bookingConfirmation.howToUseYourPass}</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </div>
              <p>
                <strong>{t.bookingConfirmation.showQRCode}:</strong> {t.bookingConfirmation.showQRCodeDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </div>
              <p>
                <strong>{t.bookingConfirmation.unlimitedRides}:</strong> {t.bookingConfirmation.unlimitedRidesDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </div>
              <p>
                <strong>{t.bookingConfirmation.regularService}:</strong> {t.bookingConfirmation.regularServiceDesc}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                4
              </div>
              <p>
                <strong>{t.bookingConfirmation.flexibleSchedule}:</strong> {t.bookingConfirmation.flexibleScheduleDesc}
              </p>
            </div>
          </div>
        </Card>

        {/* Thank You & Navigation Actions */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center border-primary/20">
          <div className="mb-6">
            <h2 className="mb-3 text-primary">🎉 {t.bookingConfirmation.thankYou}</h2>
            <p className="text-lg text-muted-foreground">
              {t.bookingConfirmation.adventureBegins} {formattedDate}!
            </p>
            <p className="mt-3 text-muted-foreground">
              {t.bookingConfirmation.confirmationSentTo} <strong>{booking.contactInfo.email}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="default"
              onClick={() => onNavigate("home")}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Home className="h-5 w-5" />
              {t.bookingConfirmation.backToHome}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("manage-booking")}
              className="gap-2 border-primary text-primary hover:bg-primary/10"
            >
              <Settings className="h-5 w-5" />
              {t.bookingConfirmation.manageBooking}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("attractions")}
              className="gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              {t.bookingConfirmation.viewAttractions}
            </Button>
          </div>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>💡 <strong>{t.bookingConfirmation.tip}:</strong> {t.bookingConfirmation.tipUseBookingId.replace('{bookingId}', booking.id)}</p>
            <p>📍 View our <button onClick={() => onNavigate("route-map")} className="text-primary hover:underline">{t.bookingConfirmation.viewRouteMap}</button> to plan your stops</p>
          </div>
        </Card>

        {/* Contact Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">{t.bookingConfirmation.questionsOrChanges}</p>
          <p>
            {t.bookingConfirmation.contactViaEmail}{" "}
            <a href="mailto:info@hoponsintra.com" className="text-primary hover:underline">
              info@hoponsintra.com
            </a>{" "}
            {t.bookingConfirmation.or}{" "}
            <a href="https://wa.me/351932967279" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              WhatsApp (+351 932 967 279)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}