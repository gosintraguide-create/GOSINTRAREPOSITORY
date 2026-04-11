import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Clock, Mail, Phone, X, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface TourBooking {
  bookingId: string;
  tourId: string;
  tourName: string;
  tourDate: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    numberOfPeople: number;
    specialRequests?: string;
  };
  totalPrice: number;
  currency: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

interface Tour {
  id: string;
  name: string;
}

export function TourCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [tourLimits, setTourLimits] = useState<Record<string, number>>({});
  const [selectedBooking, setSelectedBooking] = useState<TourBooking | null>(null);
  const [showLimitSettings, setShowLimitSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tours
  useEffect(() => {
    fetchTours();
  }, []);

  // Fetch bookings when month changes
  useEffect(() => {
    fetchBookingsForMonth();
  }, [currentDate]);

  const fetchTours = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTours(data.tours || []);
        // Fetch limits for each tour
        data.tours.forEach((tour: Tour) => fetchTourLimit(tour.id));
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast.error('Failed to load tours');
    }
  };

  const fetchTourLimit = async (tourId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-limits/${tourId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTourLimits(prev => ({ ...prev, [tourId]: data.limit }));
      }
    } catch (error) {
      console.error('Error fetching tour limit:', error);
    }
  };

  const updateTourLimit = async (tourId: string, limit: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-limits/${tourId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setTourLimits(prev => ({ ...prev, [tourId]: limit }));
        toast.success('Tour limit updated');
      } else {
        toast.error('Failed to update limit');
      }
    } catch (error) {
      console.error('Error updating tour limit:', error);
      toast.error('Failed to update limit');
    }
  };

  const fetchBookingsForMonth = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/${bookingId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Booking cancelled');
        fetchBookingsForMonth();
        setSelectedBooking(null);
      } else {
        toast.error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => {
      const bookingDate = new Date(b.tourDate).toISOString().split('T')[0];
      return bookingDate === dateStr && b.status === 'confirmed';
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Tour Bookings Calendar</h2>
        </div>
        <Button variant="outline" onClick={() => setShowLimitSettings(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Daily Limits
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-semibold">{monthName}</h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            const dayBookings = getBookingsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-24 rounded-lg border p-2 ${
                  date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'border-primary border-2' : 'border-gray-200'}`}
              >
                {date && (
                  <>
                    <div className="mb-1 text-sm font-medium">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.map(booking => (
                        <button
                          key={booking.bookingId}
                          onClick={() => setSelectedBooking(booking)}
                          className="w-full rounded bg-primary/10 px-2 py-1 text-left text-xs hover:bg-primary/20"
                        >
                          <div className="font-medium truncate">{booking.tourName}</div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {booking.customerInfo.numberOfPeople}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.bookingId}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Tour</Label>
                <p className="text-sm">{selectedBooking.tourName}</p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Date & Time</Label>
                <p className="text-sm">
                  {new Date(selectedBooking.tourDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Customer</Label>
                <div className="mt-1 space-y-1">
                  <p className="text-sm">{selectedBooking.customerInfo.name}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {selectedBooking.customerInfo.email}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedBooking.customerInfo.phone}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {selectedBooking.customerInfo.numberOfPeople} people
                  </p>
                </div>
              </div>

              {selectedBooking.customerInfo.specialRequests && (
                <div>
                  <Label className="text-sm font-semibold">Special Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.customerInfo.specialRequests}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold">Total Price</Label>
                <p className="text-lg font-bold">
                  €{selectedBooking.totalPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Status</Label>
                <div className="mt-1">
                  <Badge variant={selectedBooking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              {selectedBooking.status === 'confirmed' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => cancelBooking(selectedBooking.bookingId)}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tour Limits Settings Dialog */}
      <Dialog open={showLimitSettings} onOpenChange={setShowLimitSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Booking Limits</DialogTitle>
            <DialogDescription>
              Set the maximum number of bookings per day for each tour
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {tours.map(tour => (
              <div key={tour.id} className="flex items-center justify-between">
                <Label className="flex-1">{tour.name}</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={tourLimits[tour.id] || 5}
                  onChange={(e) => {
                    const limit = parseInt(e.target.value);
                    if (limit >= 1) {
                      updateTourLimit(tour.id, limit);
                    }
                  }}
                  className="w-20"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
