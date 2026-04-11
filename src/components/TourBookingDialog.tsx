import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

interface TourBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: {
    id: string;
    title: string;
    price: string;
  };
}

// Booking form component
function BookingForm({ tour, onSuccess }: { tour: TourBookingDialogProps['tour']; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  
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

  // Extract numeric price from price string (e.g., "€250" -> 250)
  const extractPrice = (priceStr: string): number => {
    const match = priceStr.match(/[\d,]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  };

  const tourPrice = extractPrice(tour.price);

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
    } finally {
      setLoadingAvailability(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (date < new Date()) return true;
    
    // Check if date is fully booked
    if (availability) {
      const dateStr = format(date, 'yyyy-MM-dd');
      return availability[dateStr]?.isFull || false;
    }
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet');
      return;
    }
    
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
      // 1. Create payment intent
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
          }),
        }
      );
      
      const paymentIntentData = await paymentIntentResponse.json();
      
      if (!paymentIntentData.success) {
        throw new Error(paymentIntentData.error || 'Failed to create payment intent');
      }
      
      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
          },
        }
      );
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }
      
      // 3. Create booking in database
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
            paymentIntentId: paymentIntent.id,
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
      console.error('Booking error:', error);
      setError(error.message || 'An error occurred. Please try again.');
      toast.error(error.message || 'Booking failed');
    } finally {
      setProcessing(false);
    }
  };

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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onMonthChange={checkAvailability}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {loadingAvailability && (
          <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p>
        )}
        {selectedDate && availability && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Available ({availability[format(selectedDate, 'yyyy-MM-dd')]?.available || 0} spots left)
          </p>
        )}
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
      
      <div>
        <Label>Payment Information *</Label>
        <div className="mt-2 rounded-md border border-input p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
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
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
          <span>Total</span>
          <span>€{tourPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={processing || !stripe}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Booking & Pay
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe. You will receive a confirmation email after booking.
      </p>
    </form>
  );
}

export function TourBookingDialog({ open, onOpenChange, tour }: TourBookingDialogProps) {
  const [stripePromise, setStripePromise] = useState<any>(null);

  // Load Stripe publishable key
  useState(() => {
    const loadStripeKey = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/stripe-config`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
      }
    };
    loadStripeKey();
  });

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
        
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <BookingForm tour={tour} onSuccess={handleSuccess} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading payment system...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
