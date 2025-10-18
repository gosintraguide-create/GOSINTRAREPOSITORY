import { useState, useEffect } from "react";
import { CheckCircle, Download, Mail, Calendar, Users, ArrowRight, Printer, AlertCircle, FileDown } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { TicketCard } from "./TicketCard";

interface BookingConfirmationPageProps {
  onNavigate: (page: string) => void;
  booking: any;
}

export function BookingConfirmationPage({ onNavigate, booking }: BookingConfirmationPageProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Simulate email sent status
    setTimeout(() => setEmailSent(true), 1000);
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
      link.download = `GoSintra_Tickets_${bookingIdShort}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container px-4 text-center">
          <p>No booking found. Please make a booking first.</p>
          <Button onClick={() => onNavigate("buy-ticket")} className="mt-4">
            Book Now
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
    link.download = `gosintra-qr-${passengerName.replace(/\s/g, '-')}.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background py-12">
      <div className="container max-w-4xl px-4">
        
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mb-2">Booking Confirmed!</h1>
          <p className="mb-4 text-muted-foreground">
            Your Go Sintra day pass is ready. Check your email for confirmation and QR codes.
          </p>
          
          {/* Booking ID Badge */}
          <div className="mx-auto inline-block rounded-lg bg-primary/10 px-6 py-3">
            <p className="text-sm text-muted-foreground">Booking ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{booking.id}</p>
            <p className="mt-1 text-xs text-muted-foreground">Save this for managing your booking</p>
          </div>
        </div>

        {/* Email Status */}
        {emailSent && (
          <Card className="mb-6 border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  Confirmation email sent to {booking.contactInfo.email}
                </p>
                <p className="text-green-700">
                  Your tickets PDF and booking details have been sent to your email.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Booking Summary */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-primary">Booking Summary</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Booking #{bookingIdShort}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">{formattedDate}</p>
                <p className="text-muted-foreground">9:00 AM - 8:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Passengers</p>
                <p className="text-muted-foreground">
                  {booking.passengers.length} {booking.passengers.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Total Paid</p>
              <p className="text-primary">€{booking.totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Tickets */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-primary">Your Day Pass Tickets</h2>
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
                    Downloading...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print All
              </Button>
            </div>
          </div>

          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <FileDown className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>📎 PDF Tickets Attached</strong><br/>
              We've sent a PDF with all your tickets to your email. You can also download it here or save your tickets below.
            </AlertDescription>
          </Alert>

          <div className="mb-6 rounded-lg bg-accent/10 p-4">
            <p className="font-medium text-accent-foreground">
              🎫 Your Tickets Are Ready!
            </p>
            <p className="mt-1 text-muted-foreground">
              Show these tickets to the driver when boarding. Each passenger needs their own ticket with QR code.
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

        {/* How to Use */}
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-primary">How to Use Your Pass</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </div>
              <p>
                <strong>Show QR Code:</strong> Present your QR code to the driver when boarding any vehicle
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </div>
              <p>
                <strong>Unlimited Rides:</strong> Use your pass for unlimited hop-on/hop-off rides until 8:00 PM
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </div>
              <p>
                <strong>Regular Service:</strong> New vehicles depart every 10-15 minutes from all major attractions
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                4
              </div>
              <p>
                <strong>Flexible Schedule:</strong> Spend as much time as you want at each attraction
              </p>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="text-center">
          <h3 className="mb-4 text-primary">Plan Your Visit</h3>
          <p className="mb-6 text-muted-foreground">
            Explore our attraction guide to plan your perfect day in Sintra
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate("attractions")}
              className="bg-primary"
            >
              View Attractions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("attractions")}
            >
              View Attractions
            </Button>
          </div>

          <p className="mt-6 text-muted-foreground">
            Need help? Contact us via{" "}
            <a href="mailto:info@gosintra.com" className="text-accent hover:underline">
              email
            </a>{" "}
            or{" "}
            <a href="https://wa.me/351932967279" className="text-accent hover:underline">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}