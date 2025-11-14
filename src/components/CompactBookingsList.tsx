import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  Sparkles,
  X,
} from "lucide-react";

interface CompactBookingsListProps {
  bookings: any[];
  onRefresh?: () => void;
}

export function CompactBookingsList({ bookings, onRefresh }: CompactBookingsListProps) {
  const [bookingFilter, setBookingFilter] = useState<"upcoming" | "today" | "all" | "date">("upcoming");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getFilteredBookings = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayTime = new Date(today).getTime();
    
    let filtered = bookings.filter((booking) => {
      if (!booking || !booking.id || !booking.selectedDate) return false;
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const bookingIdMatch = booking.id.toLowerCase().includes(query);
        const customerNameMatch = booking.contactInfo?.name?.toLowerCase().includes(query);
        
        if (!bookingIdMatch && !customerNameMatch) {
          return false;
        }
      }
      
      const bookingDate = booking.selectedDate;
      const bookingTime = new Date(bookingDate).getTime();
      
      if (bookingFilter === "today") {
        return bookingDate === today;
      } else if (bookingFilter === "upcoming") {
        // Show today and future bookings only
        return bookingTime >= todayTime;
      } else if (bookingFilter === "date" && selectedCalendarDate) {
        const selectedDateStr = selectedCalendarDate.toISOString().split("T")[0];
        return bookingDate === selectedDateStr;
      }
      
      return true; // "all" filter
    });

    // Sort by creation timestamp (newest first)
    // Use createdAt if available, otherwise extract timestamp from booking ID
    filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 
                    (a.id.includes('_') ? parseInt(a.id.split('_')[0]) : 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 
                    (b.id.includes('_') ? parseInt(b.id.split('_')[0]) : 0);
      return timeB - timeA; // Newest first
    });

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  // Check if booking is new (within last 30 minutes)
  const isNewBooking = (booking: any) => {
    if (booking.createdAt) {
      const createdTime = new Date(booking.createdAt).getTime();
      const now = Date.now();
      return (now - createdTime) < 30 * 60 * 1000; // 30 minutes
    }
    return false;
  };

  // Format date for calendar button
  const formatCalendarDate = (date: Date | undefined) => {
    if (!date) return "Pick a date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by booking ID or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <Label className="text-foreground text-sm font-semibold">Show:</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={bookingFilter === "upcoming" ? "default" : "outline"}
            onClick={() => {
              setBookingFilter("upcoming");
              setSelectedCalendarDate(undefined);
            }}
            className={bookingFilter === "upcoming" ? "bg-primary" : ""}
          >
            Upcoming
          </Button>
          <Button
            size="sm"
            variant={bookingFilter === "today" ? "default" : "outline"}
            onClick={() => {
              setBookingFilter("today");
              setSelectedCalendarDate(undefined);
            }}
            className={bookingFilter === "today" ? "bg-primary" : ""}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={bookingFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setBookingFilter("all");
              setSelectedCalendarDate(undefined);
            }}
            className={bookingFilter === "all" ? "bg-primary" : ""}
          >
            All Time
          </Button>
          
          {/* Calendar Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={bookingFilter === "date" ? "default" : "outline"}
                className={`gap-2 ${bookingFilter === "date" ? "bg-primary" : ""}`}
              >
                <CalendarIcon className="h-4 w-4" />
                {selectedCalendarDate ? formatCalendarDate(selectedCalendarDate) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedCalendarDate}
                onSelect={(date) => {
                  setSelectedCalendarDate(date);
                  setBookingFilter("date");
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear date filter */}
          {bookingFilter === "date" && selectedCalendarDate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedCalendarDate(undefined);
                setBookingFilter("upcoming");
              }}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredBookings.length} booking(s)
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-2">
        {filteredBookings.length === 0 ? (
          <Card className="border-border p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-secondary/50 p-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">No bookings found</p>
                <p className="text-sm text-muted-foreground">
                  {bookingFilter === "today" 
                    ? "No bookings for today yet" 
                    : bookingFilter === "date" && selectedCalendarDate
                    ? `No bookings for ${formatCalendarDate(selectedCalendarDate)}`
                    : "No bookings have been created yet"}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            // Handle both old (timestamp) and new (AB-1234) booking ID formats
            let bookingIdShort = booking.id;
            
            // If it's a timestamp-based ID (old format), convert to readable format
            if (/^\d{13}/.test(booking.id)) {
              // It's a 13-digit timestamp - show last 6 digits
              bookingIdShort = booking.id.slice(-6);
            } else if (booking.id.includes("_")) {
              // Format: timestamp_AB1234 - extract the code part
              bookingIdShort = booking.id.split("_")[1];
            }
            // Otherwise use the ID as-is (e.g., AB-1234)
            
            const totalPassengers = booking.passengers?.length || 0;
            const checkedInCount = (booking.checkIns || []).filter(
              (checkInArray: any[]) => checkInArray && checkInArray.length > 0
            ).length;

            // Format date - compact version
            const dateObj = new Date(booking.selectedDate);
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });

            const isExpanded = expandedBookingId === booking.id;

            return (
              <Card
                key={booking.id}
                className={`border-border ${isNewBooking(booking) ? 'border-l-4 border-l-accent' : ''}`}
              >
                {/* Compact Header - Always Visible */}
                <button
                  onClick={() => toggleExpand(booking.id)}
                  className="w-full p-4 text-left hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: ID, Name, Date/Time */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-mono text-lg text-primary font-semibold">
                        #{bookingIdShort}
                      </span>
                      {isNewBooking(booking) && (
                        <Badge className="bg-accent text-white gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          NEW
                        </Badge>
                      )}
                      <div className="h-4 w-px bg-border" />
                      <span className="text-foreground font-medium truncate">
                        {booking.contactInfo?.name || "N/A"}
                      </span>
                      <div className="h-4 w-px bg-border hidden sm:block" />
                      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                        <Clock className="h-3.5 w-3.5 ml-2" />
                        <span>{booking.timeSlot}</span>
                      </div>
                    </div>

                    {/* Right: Status & Expand Button */}
                    <div className="flex items-center gap-3">
                      {checkedInCount === 0 ? (
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      ) : checkedInCount === totalPassengers ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {checkedInCount}/{totalPassengers}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Contact Info */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Contact</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">
                                {booking.contactInfo?.email || "N/A"}
                              </span>
                            </div>
                            {booking.contactInfo?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">
                                  {booking.contactInfo.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:hidden">
                          <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                          <div className="flex items-center gap-3 text-sm text-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{booking.timeSlot}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Stats & Extras */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                          <p className="text-2xl font-semibold text-primary">
                            €{booking.totalPrice?.toFixed(2) || "0.00"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Passengers</p>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-medium">{totalPassengers}</span>
                            <span className="text-muted-foreground text-sm">
                              {totalPassengers === 1 ? 'guest' : 'guests'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check-ins</p>
                          <p className="text-sm text-foreground">
                            {checkedInCount} of {totalPassengers} checked in
                          </p>
                        </div>

                        {booking.guidedCommentary && (
                          <div className="rounded-md bg-accent/10 px-3 py-2 inline-flex">
                            <p className="text-sm text-accent font-medium">✓ Guided Commentary</p>
                          </div>
                        )}

                        {booking.selectedAttractions && booking.selectedAttractions.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Attractions</p>
                            <div className="space-y-1">
                              {booking.selectedAttractions.map((attr: any, idx: number) => (
                                <p key={idx} className="text-sm text-foreground">
                                  • {attr.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}