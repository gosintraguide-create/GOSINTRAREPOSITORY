import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Clock, Mail, Phone, X, Settings, Plus, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  isManual?: boolean;
  packageType?: string; // halfDay, fullDay, or custom
}

interface Tour {
  id: string;
  name: string;
  price?: string;
}

interface DayAvailability {
  date: string;
  tourId: string;
  customLimit?: number;
  available: number;
  booked: number;
}

export function TourCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [tourLimits, setTourLimits] = useState<Record<string, number>>({});
  const [dayLimits, setDayLimits] = useState<Record<string, Record<string, number>>>({});
  const [selectedBooking, setSelectedBooking] = useState<TourBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showLimitSettings, setShowLimitSettings] = useState(false);
  const [showDaySettings, setShowDaySettings] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  // New booking form state
  const [newBookingForm, setNewBookingForm] = useState({
    tourId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfPeople: 1,
    specialRequests: '',
    totalPrice: 0,
    packageType: '', // halfDay, fullDay, or custom
  });

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

  const getAvailabilityForDate = (date: Date | null) => {
    if (!date) return {};
    const dayBookings = getBookingsForDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const availability: Record<string, { booked: number; available: number; limit: number }> = {};
    
    tours.forEach(tour => {
      const tourBookings = dayBookings.filter(b => b.tourId === tour.id);
      const booked = tourBookings.reduce((sum, b) => sum + b.customerInfo.numberOfPeople, 0);
      
      // Check for day-specific limit first, then fall back to tour default
      const limit = dayLimits[dateStr]?.[tour.id] || tourLimits[tour.id] || 5;
      
      availability[tour.id] = {
        booked,
        available: Math.max(0, limit - booked),
        limit,
      };
    });
    
    return availability;
  };

  const handleDayClick = (date: Date, action: 'book' | 'settings') => {
    setSelectedDate(date);
    if (action === 'book') {
      setNewBookingForm({
        tourId: tours[0]?.id || '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        numberOfPeople: 1,
        specialRequests: '',
        totalPrice: 0,
        packageType: '', // halfDay, fullDay, or custom
      });
      setShowNewBooking(true);
    } else {
      setShowDaySettings(true);
    }
  };

  const createManualBooking = async () => {
    if (!selectedDate) return;
    
    if (!newBookingForm.tourId || !newBookingForm.customerName || !newBookingForm.customerEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-bookings/create-manual`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tourId: newBookingForm.tourId,
            tourDate: selectedDate.toISOString(),
            customerInfo: {
              name: newBookingForm.customerName,
              email: newBookingForm.customerEmail,
              phone: newBookingForm.customerPhone,
              numberOfPeople: newBookingForm.numberOfPeople,
              specialRequests: newBookingForm.specialRequests,
            },
            totalPrice: newBookingForm.totalPrice,
            packageType: newBookingForm.packageType,
          }),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        toast.success('Booking created successfully');
        fetchBookingsForMonth();
        setShowNewBooking(false);
        setSelectedDate(null);
      } else {
        toast.error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating manual booking:', error);
      toast.error('Failed to create booking');
    }
  };

  const updateDayLimit = async (tourId: string, limit: number) => {
    if (!selectedDate) return;
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-day-limit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tourId,
            date: dateStr,
            limit,
          }),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Update local state
        setDayLimits(prev => ({
          ...prev,
          [dateStr]: {
            ...(prev[dateStr] || {}),
            [tourId]: limit,
          },
        }));
        toast.success('Day limit updated');
      } else {
        toast.error(data.error || 'Failed to update day limit');
      }
    } catch (error) {
      console.error('Error updating day limit:', error);
      toast.error('Failed to update day limit');
    }
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
            const dayAvailabilityInfo = getAvailabilityForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            const totalBooked = dayBookings.reduce((sum, b) => sum + b.customerInfo.numberOfPeople, 0);
            const totalAvailable = Object.values(dayAvailabilityInfo).reduce((sum, info) => sum + info.available, 0);
            const isPast = date && date < new Date(new Date().setHours(0, 0, 0, 0));
            
            return (
              <div
                key={index}
                className={`min-h-32 rounded-lg border p-2 transition-colors ${
                  date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'border-primary border-2' : 'border-gray-200'} ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                {date && (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{date.getDate()}</span>
                      {!isPast && (
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleDayClick(date, 'book')}
                            className="rounded p-0.5 hover:bg-primary/10 transition-colors"
                            title="Add booking"
                          >
                            <Plus className="h-3 w-3 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDayClick(date, 'settings')}
                            className="rounded p-0.5 hover:bg-primary/10 transition-colors"
                            title="Day settings"
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Availability Summary */}
                    {totalBooked > 0 && (
                      <div className="mb-2 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {totalBooked} booked · {totalAvailable} available
                      </div>
                    )}
                    
                    {/* Bookings List */}
                    <div className="space-y-1">
                      {dayBookings.map(booking => (
                        <button
                          key={booking.bookingId}
                          onClick={() => setSelectedBooking(booking)}
                          className={`w-full rounded px-2 py-1 text-left text-xs hover:bg-primary/20 transition-colors ${
                            booking.isManual ? 'bg-orange-500/10' : 'bg-primary/10'
                          }`}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            {booking.isManual && <span className="text-orange-600">★</span>}
                            {booking.tourName}
                          </div>
                          <div className="flex items-center justify-between gap-1 text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {booking.customerInfo.numberOfPeople}
                            </span>
                            <span className="truncate text-[10px]">{booking.customerInfo.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Tour Availability Indicators - Show when there are some bookings but room for more tours */}
                    {Object.keys(dayAvailabilityInfo).length > 0 && dayBookings.length < tours.length && (
                      <div className="mt-2 space-y-1">
                        {tours.map(tour => {
                          const info = dayAvailabilityInfo[tour.id];
                          if (!info || !tour.name) return null;
                          
                          // Show tours that have no bookings yet but have availability
                          const hasBooking = dayBookings.some(b => b.tourId === tour.id);
                          if (hasBooking) return null;
                          
                          const percentBooked = (info.booked / info.limit) * 100;
                          
                          return (
                            <div key={tour.id} className="text-[10px] bg-muted/30 rounded px-1.5 py-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="truncate text-muted-foreground font-medium">
                                  {tour.name.length > 18 ? `${tour.name.substring(0, 18)}...` : tour.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {info.available}/{info.limit}
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    percentBooked >= 100 ? 'bg-red-500' :
                                    percentBooked >= 80 ? 'bg-orange-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(percentBooked, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
              {selectedBooking.isManual && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <span className="text-orange-600">★</span>
                    Manual Booking
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-sm font-semibold">Tour</Label>
                <p className="text-sm">{selectedBooking.tourName}</p>
              </div>

              {selectedBooking.packageType && (() => {
                const packageTour = tours.find(t => t.id === selectedBooking.packageType);
                return packageTour ? (
                  <div>
                    <Label className="text-sm font-semibold">Package</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {packageTour.name}
                        {packageTour.price && ` - ${packageTour.price}`}
                      </Badge>
                    </div>
                  </div>
                ) : null;
              })()}

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
              Set the default maximum number of bookings per day for each tour
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

      {/* Day Settings Dialog */}
      <Dialog open={showDaySettings} onOpenChange={setShowDaySettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Day-Specific Limits</DialogTitle>
            <DialogDescription>
              Override default limits for this specific day
            </DialogDescription>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Date</Label>
                <p className="text-sm">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground mb-2">
                  Set custom limits (0 = use default)
                </Label>
                <div className="space-y-3 mt-2">
                  {tours.map(tour => {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    const currentLimit = dayLimits[dateStr]?.[tour.id] || 0;
                    const defaultLimit = tourLimits[tour.id] || 5;
                    
                    return (
                      <div key={tour.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="flex-1">{tour.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={currentLimit}
                            onChange={(e) => {
                              const limit = parseInt(e.target.value) || 0;
                              if (limit >= 0) {
                                updateDayLimit(tour.id, limit);
                              }
                            }}
                            className="w-20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Default: {defaultLimit} · Current: {currentLimit > 0 ? currentLimit : `${defaultLimit} (default)`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Booking Dialog */}
      <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Booking</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tour">Tour *</Label>
              <Select
                value={newBookingForm.tourId}
                onValueChange={(value) => setNewBookingForm(prev => ({ ...prev, tourId: value }))}
              >
                <SelectTrigger id="tour">
                  <SelectValue placeholder="Select a tour" />
                </SelectTrigger>
                <SelectContent>
                  {tours.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No tours available</div>
                  ) : (
                    tours.map(tour => {
                      // Show availability for each tour
                      const dateStr = selectedDate?.toISOString().split('T')[0] || '';
                      const dayLimit = dayLimits[dateStr]?.[tour.id] || tourLimits[tour.id] || 5;
                      const dayBookings = selectedDate ? getBookingsForDate(selectedDate) : [];
                      const tourBookings = dayBookings.filter(b => b.tourId === tour.id);
                      const booked = tourBookings.reduce((sum, b) => sum + b.customerInfo.numberOfPeople, 0);
                      const available = Math.max(0, dayLimit - booked);
                      
                      return (
                        <SelectItem key={tour.id} value={tour.id}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span>{tour.name}</span>
                            <span className={`text-xs ${available === 0 ? 'text-red-600' : available <= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                              ({available} available)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {tours.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Please create tours first in the Admin Console
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                type="text"
                value={newBookingForm.customerName}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newBookingForm.customerEmail}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={newBookingForm.customerPhone}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="+351 912 345 678"
              />
            </div>

            <div>
              <Label htmlFor="numberOfPeople">Number of People</Label>
              <Input
                id="numberOfPeople"
                type="number"
                min="1"
                max="50"
                value={newBookingForm.numberOfPeople}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label htmlFor="packageType">Tour Package</Label>
              <Select
                value={newBookingForm.packageType}
                onValueChange={(value) => setNewBookingForm(prev => ({ ...prev, packageType: value }))}
              >
                <SelectTrigger id="packageType">
                  <SelectValue placeholder="Select a package (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {tours.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No packages available</div>
                  ) : (
                    tours.map(tour => (
                      <SelectItem key={tour.id} value={tour.id}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{tour.name}</span>
                          {tour.price && (
                            <span className="text-xs text-muted-foreground">{tour.price}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Select which tour package this booking is for
              </p>
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={newBookingForm.specialRequests}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="totalPrice">Total Price (€)</Label>
              <Input
                id="totalPrice"
                type="number"
                min="0"
                step="0.01"
                value={newBookingForm.totalPrice}
                onChange={(e) => setNewBookingForm(prev => ({ ...prev, totalPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <Button
              className="w-full"
              onClick={createManualBooking}
              disabled={!newBookingForm.tourId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}