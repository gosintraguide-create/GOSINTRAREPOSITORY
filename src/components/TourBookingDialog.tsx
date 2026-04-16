import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar as CalendarIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { StripePaymentForm } from './StripePaymentForm';

interface TourBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: {
    id: string;
    title: string;
    price: string;
    pricingMode?: 'per-person' | 'group-tiers' | 'fixed' | 'quote-only';
    perPersonPrice?: number;
    groupTiers?: Array<{
      minPeople: number;
      maxPeople: number;
      price: number;
    }>;
    fixedPrice?: number;
    maxGroupSize?: number;
    allowQuoteRequest?: boolean;
  };
}

// Booking form component
function BookingForm({ tour, onSuccess }: { tour: TourBookingDialogProps['tour']; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    numberOfPeople: 1,
    specialRequests: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Extract numeric price from price string (e.g., "€250" -> 250)
  const extractPrice = (priceStr: string): number => {
    const match = priceStr.match(/[\d,]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  };

  // Calculate price based on pricing mode
  const calculateTourPrice = (): number => {
    const { pricingMode, perPersonPrice, groupTiers, fixedPrice } = tour;
    const numPeople = formData.numberOfPeople;

    // If no pricing mode set, use legacy price extraction
    if (!pricingMode) {
      return extractPrice(tour.price);
    }

    switch (pricingMode) {
      case 'per-person':
        return (perPersonPrice || 0) * numPeople;
      
      case 'group-tiers':
        if (groupTiers && groupTiers.length > 0) {
          // Find the appropriate tier
          const tier = groupTiers.find(
            t => numPeople >= t.minPeople && numPeople <= t.maxPeople
          );
          return tier?.price || 0;
        }
        return 0;
      
      case 'fixed':
        return fixedPrice || 0;
      
      case 'quote-only':
        return 0; // No price for quote-only
      
      default:
        return extractPrice(tour.price);
    }
  };

  // Check if we should show quote request instead of booking
  const shouldShowQuoteRequest = (): boolean => {
    const { pricingMode, maxGroupSize, allowQuoteRequest } = tour;
    const numPeople = formData.numberOfPeople;

    // Always show quote request for quote-only mode
    if (pricingMode === 'quote-only') {
      return true;
    }

    // Show quote request if group exceeds max and quote requests are allowed
    if (allowQuoteRequest && maxGroupSize && numPeople > maxGroupSize) {
      return true;
    }

    // For group tiers, show quote if no tier matches
    if (pricingMode === 'group-tiers' && tour.groupTiers) {
      const hasTier = tour.groupTiers.some(
        t => numPeople >= t.minPeople && numPeople <= t.maxPeople
      );
      if (!hasTier && allowQuoteRequest) {
        return true;
      }
    }

    return false;
  };

  const tourPrice = calculateTourPrice();
  const isQuoteRequest = shouldShowQuoteRequest();

  // Check availability for selected month
  const checkAvailability = async (date: Date) => {
    setLoadingAvailability(true);
    try {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-availability/${tour.id}?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setAvailability(data.availability);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to load availability. Please try again.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Load initial availability when component mounts
  useEffect(() => {
    checkAvailability(currentMonth);
  }, [tour.id]);

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    checkAvailability(date);
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // Check if date is fully booked
    if (availability) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAvailability = availability[dateStr];
      
      // Disable if explicitly marked as full or if available spots is 0
      if (dayAvailability?.isFull || dayAvailability?.available === 0) {
        return true;
      }
    }
    
    return false;
  };

  // Get availability status for a date
  const getAvailabilityStatus = (date: Date) => {
    if (!availability) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability[dateStr];
    
    if (!dayAvailability) return null;
    
    if (dayAvailability.isFull || dayAvailability.available === 0) {
      return 'full';
    } else if (dayAvailability.available <= 2) {
      return 'limited';
    } else {
      return 'available';
    }
  };

  // Custom day content to show availability indicators
  const renderDayContent = (date: Date) => {
    const status = getAvailabilityStatus(date);
    const isDisabled = isDateDisabled(date);
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={isDisabled ? 'text-muted-foreground' : ''}>{date.getDate()}</span>
        {status && !isDisabled && (
          <div className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
            status === 'full' ? 'bg-red-500' :
            status === 'limited' ? 'bg-orange-500' :
            'bg-green-500'
          }`} />
        )}
      </div>
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAvailability = availability?.[dateStr];
      
      if (dayAvailability?.available && dayAvailability.available < formData.numberOfPeople) {
        toast.warning(`Only ${dayAvailability.available} spots available on this date`);
        setError(`Only ${dayAvailability.available} spots available. Please reduce the number of people or select a different date.`);
        return;
      }
    }
    
    setSelectedDate(date);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      // Handle quote request separately
      if (isQuoteRequest) {
        const quoteResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-quote-requests/create`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tourId: tour.id,
              tourTitle: tour.title,
              tourDate: selectedDate.toISOString(),
              customerInfo: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                numberOfPeople: formData.numberOfPeople,
                specialRequests: formData.specialRequests,
              },
            }),
          }
        );
        
        const quoteData = await quoteResponse.json();
        
        if (!quoteData.success) {
          throw new Error(quoteData.error || 'Failed to submit quote request');
        }
        
        toast.success('Quote request submitted! We\'ll contact you within 24 hours.');
        onSuccess();
        return;
      }
      
      // Regular booking flow with payment
      // Create payment intent
      const paymentIntentResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tourId: tour.id,
            amount: tourPrice,
            currency: 'eur',
            customerEmail: formData.email,
            metadata: {
              tourId: tour.id,
              tourTitle: tour.title,
              tourDate: selectedDate.toISOString(),
              customerName: formData.name,
              customerPhone: formData.phone,
              numberOfPeople: formData.numberOfPeople.toString(),
            },
          }),
        }
      );
      
      const paymentIntentData = await paymentIntentResponse.json();
      
      if (!paymentIntentData.success) {
        throw new Error(paymentIntentData.error || 'Failed to create payment intent');
      }
      
      // Show payment form with client secret
      setClientSecret(paymentIntentData.clientSecret);
      setShowPayment(true);
      
    } catch (error: any) {
      console.error('Payment setup error:', error);
      setError(error.message || 'An error occurred. Please try again.');
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedDate) return;
    
    try {
      // Create booking in database
      const bookingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tourId: tour.id,
            tourDate: selectedDate.toISOString(),
            customerInfo: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              numberOfPeople: formData.numberOfPeople,
              specialRequests: formData.specialRequests,
            },
            paymentIntentId: paymentIntentId,
          }),
        }
      );
      
      const bookingData = await bookingResponse.json();
      
      if (!bookingData.success) {
        throw new Error(bookingData.error || 'Failed to create booking');
      }
      
      toast.success('Booking confirmed! Check your email for details.');
      onSuccess();
      
    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast.error(error.message || 'Booking failed. Please contact support with your payment confirmation.');
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPayment(false);
    setClientSecret(null);
  };

  // If payment form is shown, display it
  if (showPayment && clientSecret) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{tour.title}</p>
              <p className="text-sm">Date: {selectedDate ? format(selectedDate, 'PPP') : ''}</p>
              <p className="text-sm">Guest: {formData.name}</p>
              <p className="text-sm">People: {formData.numberOfPeople}</p>
            </div>
          </AlertDescription>
        </Alert>
        
        <StripePaymentForm
          amount={tourPrice}
          clientSecret={clientSecret}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          customerEmail={formData.email}
          metadata={{
            tourId: tour.id,
            tourTitle: tour.title,
            tourDate: selectedDate?.toISOString() || '',
          }}
        />
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setShowPayment(false);
            setClientSecret(null);
          }}
        >
          Back to Booking Details
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+351 912 345 678"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="numberOfPeople">Number of People</Label>
        <Input
          id="numberOfPeople"
          type="number"
          min="1"
          max="20"
          value={formData.numberOfPeople}
          onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) })}
        />
      </div>
      
      <div>
        <Label>Tour Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                disabled={isDateDisabled}
                initialFocus
                dayContent={renderDayContent}
              />
              
              {/* Availability Legend */}
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-foreground">Availability:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Limited (≤2)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground line-through">Fully Booked</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {loadingAvailability && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking availability...
          </p>
        )}
        {selectedDate && availability && (() => {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          const dayAvailability = availability[dateStr];
          const spotsLeft = dayAvailability?.available || 0;
          
          return (
            <div className="mt-1 text-xs">
              {spotsLeft > 0 ? (
                <p className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Available ({spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left)
                </p>
              ) : (
                <p className="text-muted-foreground">No availability data for this date</p>
              )}
            </div>
          );
        })()}
      </div>
      
      <div>
        <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
        <Textarea
          id="specialRequests"
          value={formData.specialRequests}
          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          placeholder="Any special requirements or preferences..."
          rows={3}
        />
      </div>
      
      <div className="rounded-lg bg-muted p-4">
        <div className="flex justify-between text-sm">
          <span>Tour Price</span>
          <span className="font-semibold">{tour.price}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-muted-foreground">
          <span>Number of People</span>
          <span>{formData.numberOfPeople}</span>
        </div>
        {!isQuoteRequest && (
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Total</span>
            <span>€{tourPrice.toFixed(2)}</span>
          </div>
        )}
        {isQuoteRequest && (
          <Alert className="mt-3 bg-accent/10 border-accent">
            <AlertDescription className="text-sm">
              {tour.pricingMode === 'quote-only' 
                ? 'Pricing is customized for this tour. We\'ll send you a personalized quote within 24 hours.'
                : `For groups of ${formData.numberOfPeople} people, we\'ll provide a personalized quote within 24 hours.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={processing}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isQuoteRequest ? 'Submitting request...' : 'Setting up payment...'}
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {isQuoteRequest ? 'Request Personalized Quote' : 'Continue to Payment'}
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        {isQuoteRequest 
          ? 'We\'ll review your request and send you a custom quote via email within 24 hours.'
          : 'Secure payment powered by Stripe. You will receive a confirmation email after booking.'}
      </p>
    </form>
  );
}

export function TourBookingDialog({ open, onOpenChange, tour }: TourBookingDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Your Private Tour</DialogTitle>
          <DialogDescription>
            {tour.title} - Complete the form below to confirm your booking
          </DialogDescription>
        </DialogHeader>
        
        <BookingForm tour={tour} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}