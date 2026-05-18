import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Calendar } from './ui/calendar';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, Calendar as CalendarIcon, Minus, Plus, Info } from 'lucide-react';
import { format } from 'date-fns';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { StripePaymentForm } from './StripePaymentForm';
import { cn } from './ui/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TIME_SLOTS = [
  '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const LANGUAGES = ['English', 'Portuguese', 'Spanish', 'French', 'German', 'Italian', 'Dutch'];

/** Convert a 12-hour slot string to 24-hour HH:MM */
function to24h(slot: string): string {
  const [time, meridiem] = slot.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'datetime' | 'details' | 'payment';

interface TourBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: {
    id: string;
    title: string;
    price: string;
    pricingMode?: 'per-person' | 'group-tiers' | 'fixed' | 'quote-only';
    perPersonPrice?: number;
    minPeople?: number;
    groupTiers?: Array<{ minPeople: number; maxPeople: number; price: number }>;
    fixedPrice?: number;
    maxGroupSize?: number;
    allowQuoteRequest?: boolean;
    availableTimeSlots?: string[];
  };
  initialDate?: Date;
  initialPeople?: number;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'datetime', label: 'Date & Time' },
    { key: 'details',  label: 'Your Details' },
    { key: 'payment',  label: 'Payment' },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 pb-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                i < idx  ? 'bg-primary text-primary-foreground' :
                i === idx ? 'bg-primary text-primary-foreground' :
                            'border border-border bg-background text-muted-foreground'
              )}
            >
              {i < idx ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs font-medium hidden sm:inline', i === idx ? 'text-primary' : 'text-muted-foreground')}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('h-px w-6 sm:w-10', i < idx ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main booking form ────────────────────────────────────────────────────────

function BookingForm({ tour, onSuccess, initialDate, initialPeople }: { tour: TourBookingDialogProps['tour']; onSuccess: () => void; initialDate?: Date; initialPeople?: number }) {
  // Steps
  const [step, setStep] = useState<Step>('datetime');

  // Step 1 state — pre-filled from booking card if provided
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(initialPeople ?? tour.minPeople ?? 1);
  const [currentMonth, setCurrentMonth] = useState(initialDate ?? new Date());
  const [availability, setAvailability] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Step 2 state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [specialRequests, setSpecialRequests] = useState('');

  // Step 3 / payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  // Time slots to show — configured per tour, fallback to full list
  const timeSlots =
    tour.availableTimeSlots && tour.availableTimeSlots.length > 0
      ? tour.availableTimeSlots
      : ALL_TIME_SLOTS;

  // ── Pricing helpers ────────────────────────────────────────────────────────

  // ── Guest limits (declared first — used in calculateTourPrice below) ─────────
  const minGuests = tour.minPeople ?? 1;
  const maxGuests = 20;

  const calculateTourPrice = (): number => {
    const { pricingMode, perPersonPrice, groupTiers, fixedPrice } = tour;
    // Always charge for at least minPeople even if fewer are selected
    const effectivePeople = Math.max(numberOfPeople, minGuests);
    if (!pricingMode) {
      const m = tour.price.replace(/,/g, '').match(/[\d.]+/);
      return m ? parseFloat(m[0]) : 0;
    }
    switch (pricingMode) {
      case 'per-person':    return (perPersonPrice || 0) * effectivePeople;
      case 'group-tiers': {
        const tier = (groupTiers || []).find(t => effectivePeople >= t.minPeople && effectivePeople <= t.maxPeople);
        return tier?.price || 0;
      }
      case 'fixed':       return fixedPrice || 0;
      case 'quote-only':  return 0;
      default: {
        const m = tour.price.replace(/,/g, '').match(/[\d.]+/);
        return m ? parseFloat(m[0]) : 0;
      }
    }
  };

  const isQuoteRequest = (): boolean => {
    const { pricingMode, maxGroupSize, allowQuoteRequest } = tour;
    if (pricingMode === 'quote-only') return true;
    if (allowQuoteRequest && maxGroupSize && numberOfPeople > maxGroupSize) return true;
    if (pricingMode === 'group-tiers' && tour.groupTiers) {
      const hasTier = tour.groupTiers.some(t => numberOfPeople >= t.minPeople && numberOfPeople <= t.maxPeople);
      if (!hasTier && allowQuoteRequest) return true;
    }
    return false;
  };

  const tourPrice = calculateTourPrice();
  const quoteMode = isQuoteRequest();

  // ── Availability ───────────────────────────────────────────────────────────

  const checkAvailability = async (date: Date) => {
    setLoadingAvailability(true);
    try {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-availability/${tour.id}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await res.json();
      if (data.success) setAvailability(data.availability);
    } catch {
      // non-blocking
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => { checkAvailability(currentMonth); }, [tour.id]);

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    checkAvailability(date);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (availability) {
      const ds = format(date, 'yyyy-MM-dd');
      const d = availability[ds];
      if (d?.isFull || d?.available === 0) return true;
    }
    return false;
  };

  const getAvailabilityStatus = (date: Date): 'available' | 'limited' | 'full' | null => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) return null; // past — no dot
    if (!availability) return 'available'; // data still loading — optimistically show green
    const ds = format(date, 'yyyy-MM-dd');
    const d = availability[ds];
    if (!d) return 'available'; // no bookings on this date → fully open
    if (d.isFull || d.available === 0) return 'full';
    if (d.available <= 2) return 'limited';
    return 'available';
  };

  // Passed as components.DayContent to react-day-picker via Calendar
  const DayContent = ({ date }: { date: Date }) => {
    const status = getAvailabilityStatus(date);
    const disabled = isDateDisabled(date);
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center leading-none">
        <span>{date.getDate()}</span>
        {status && !disabled && (
          <span className={cn(
            'absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
            status === 'full'    ? 'bg-red-500' :
            status === 'limited' ? 'bg-amber-500' :
                                   'bg-green-500'
          )} />
        )}
      </div>
    );
  };

  // ── API calls ──────────────────────────────────────────────────────────────

  const buildTourDate = () =>
    selectedDate && selectedTime
      ? `${format(selectedDate, 'yyyy-MM-dd')}T${to24h(selectedTime)}:00`
      : selectedDate
        ? selectedDate.toISOString()
        : '';

  const handleContinueToPayment = async () => {
    if (!name || !email || !phone) { setError('Please fill in all required fields'); return; }
    setError('');
    setProcessing(true);
    try {
      if (quoteMode) {
        // Submit quote request
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-quote-requests/create`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tourId: tour.id,
              tourTitle: tour.title,
              tourDate: buildTourDate(),
              customerInfo: { name, email, phone, numberOfPeople, language, specialRequests },
            }),
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to submit quote request');
        setQuoteSubmitted(true);
        setStep('payment');
        return;
      }
      // Create payment intent
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/create-payment-intent`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId: tour.id,
            amount: tourPrice,
            currency: 'eur',
            customerEmail: email,
            metadata: {
              tourId: tour.id,
              tourTitle: tour.title,
              tourDate: buildTourDate(),
              customerName: name,
              customerPhone: phone,
              numberOfPeople: String(numberOfPeople),
            },
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create payment intent');
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/create`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId: tour.id,
            tourTitle: tour.title,
            tourDate: buildTourDate(),
            customerInfo: { name, email, phone, numberOfPeople, language, specialRequests },
            paymentIntentId,
            amount: tourPrice,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create booking');
      toast.success('Booking confirmed! Check your email for details.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Booking failed. Please contact support with your payment confirmation.');
    }
  };

  const handlePaymentError = (err: string) => {
    setError(err);
    setStep('details');
    setClientSecret(null);
  };

  // ── Guest count ─────────────────────────────────────────────────────────────
  // minGuests / maxGuests declared above (before calculateTourPrice)

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      <StepIndicator current={step} />

      {/* ── STEP 1: Date, Time & Guests ──────────────────────────────────── */}
      {step === 'datetime' && (
        <div className="flex flex-col gap-6 md:flex-row md:gap-0 md:min-h-[420px]">
          {/* Left: Calendar */}
          <div className="flex-shrink-0 md:w-[58%] md:pr-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select a Date
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setSelectedTime(''); }}
              onMonthChange={handleMonthChange}
              disabled={isDateDisabled}
              initialFocus
              components={{ DayContent }}
              classNames={{
                months: 'w-full',
                month: 'w-full space-y-2',
                caption: 'flex justify-center pt-1 pb-2 relative items-center',
                caption_label: 'text-base font-semibold',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse',
                head_row: 'flex w-full',
                head_cell: 'text-muted-foreground rounded-md flex-1 font-medium text-xs text-center py-1',
                row: 'flex w-full mt-1',
                cell: 'flex-1 text-center text-sm p-0.5 relative',
                day: 'h-10 w-full rounded-lg p-0 font-normal text-sm aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground transition-colors',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold',
                day_today: 'bg-accent text-accent-foreground font-semibold',
                day_outside: 'text-muted-foreground opacity-40',
                day_disabled: 'text-muted-foreground opacity-25 cursor-not-allowed',
              }}
            />
            {loadingAvailability && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> Limited</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Full</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-border flex-shrink-0" />

          {/* Right: Time slots + Preferences */}
          <div className="flex flex-col gap-5 flex-1 md:pl-8">
            {/* Time slots */}
            {selectedDate ? (
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available Times</p>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        'rounded-lg border py-2.5 text-sm font-medium transition-colors',
                        selectedTime === slot
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 min-h-[140px]">
                <div className="flex flex-col items-center gap-2 text-center">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">Pick a date to see available times</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Guests + price summary */}
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guests</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setNumberOfPeople((n) => Math.max(1, n - 1))}
                    disabled={numberOfPeople <= 1}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      numberOfPeople <= 1
                        ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-24 text-center text-lg font-bold">
                    {numberOfPeople} {numberOfPeople === 1 ? 'guest' : 'guests'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNumberOfPeople((n) => Math.min(maxGuests, n + 1))}
                    disabled={numberOfPeople >= maxGuests}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      numberOfPeople >= maxGuests
                        ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {/* Fixed-height slot — always present so it never shifts surrounding layout */}
                <div className="mt-2 h-9">
                  {minGuests > 1 && numberOfPeople < minGuests && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 border border-amber-200 h-full">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Heads up! This tour has a {minGuests}-guest minimum, so that's what we'll charge for.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">
                    {quoteMode ? 'Quote on request' : tourPrice > 0 ? `€${tourPrice.toFixed(2)}` : tour.price}
                  </p>
                </div>
                <Button
                  className="h-11 px-6"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep('details')}
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Your Details ─────────────────────────────────────────── */}
      {step === 'details' && (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 912 345 678" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Preferred Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!['English', 'Spanish', 'Portuguese'].includes(language) && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  We guarantee tours in English, Spanish and Portuguese. For other languages we'll do our best to accommodate you!
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="requests">Special Requests <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Accessibility needs, dietary requirements, specific sites you'd love to visit…"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Summary card */}
          <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tour</span>
              <span className="font-medium">{tour.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{selectedDate ? format(selectedDate, 'dd MMM yyyy') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{selectedTime || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guests</span>
              <span className="font-medium">{numberOfPeople}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold text-base">
              <span>{quoteMode ? 'Pricing' : 'Total'}</span>
              <span className="text-primary">
                {quoteMode ? 'Personalised quote' : `€${tourPrice.toFixed(2)}`}
              </span>
            </div>
          </div>

          {quoteMode && (
            <Alert className="border-primary/30 bg-primary/5">
              <AlertDescription className="text-sm text-foreground">
                We'll review your request and send you a personalised quote within 24 hours. No payment needed until you're happy to confirm.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep('datetime')} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1"
              disabled={processing}
              onClick={handleContinueToPayment}
            >
              {processing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{quoteMode ? 'Submitting…' : 'Setting up payment…'}</>
              ) : (
                quoteMode ? 'Request Personalised Quote' : 'Continue to Payment'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Payment or Quote success ─────────────────────────────── */}
      {step === 'payment' && (
        <div className="space-y-4">
          {/* Quote success state */}
          {quoteMode && quoteSubmitted && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Quote Request Sent!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll review your request and email you a personalised quote within 24 hours.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm w-full text-left space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Tour</span><span className="font-medium">{tour.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedDate ? format(selectedDate, 'dd MMM yyyy') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span className="font-medium">{numberOfPeople}</span></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Confirmation sent to <strong>{email}</strong>
              </p>
              <Button className="w-full" onClick={onSuccess}>Done</Button>
            </div>
          )}

          {/* Stripe payment */}
          {!quoteMode && clientSecret && (
            <div className="space-y-4">
              {/* Compact booking summary */}
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-0.5">
                    <p className="font-semibold text-foreground">{tour.title}</p>
                    <p className="text-muted-foreground">
                      {selectedDate ? format(selectedDate, 'dd MMM yyyy') : ''} · {selectedTime} · {numberOfPeople} {numberOfPeople === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <p className="text-base font-bold text-primary">€{tourPrice.toFixed(2)}</p>
                </div>
              </div>

              <StripePaymentForm
                amount={tourPrice}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                customerEmail={email}
                metadata={{ tourId: tour.id, tourTitle: tour.title, tourDate: buildTourDate() }}
              />

              <Button variant="ghost" size="sm" className="w-full gap-1" onClick={() => { setStep('details'); setClientSecret(null); }}>
                <ChevronLeft className="h-4 w-4" /> Back to details
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dialog wrapper ───────────────────────────────────────────────────────────

export function TourBookingDialog({ open, onOpenChange, tour, initialDate, initialPeople }: TourBookingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Book Your Private Tour</DialogTitle>
          <DialogDescription>Ready to book your {tour.title}? Just follow the steps below and we'll take care of the rest.</DialogDescription>
        </DialogHeader>
        <BookingForm tour={tour} onSuccess={() => onOpenChange(false)} initialDate={initialDate} initialPeople={initialPeople} />
      </DialogContent>
    </Dialog>
  );
}
