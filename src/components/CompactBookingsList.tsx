import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

interface CompactBookingsListProps {
  bookings: any[];
  onRefresh?: () => void;
}

export function CompactBookingsList({ bookings, onRefresh }: CompactBookingsListProps) {
  const [bookingFilter, setBookingFilter] = useState<"all" | "today" | "date">("all");
  const [bookingFilterDate, setBookingFilterDate] = useState<string>("");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const getFilteredBookings = () => {
    const today = new Date().toISOString().split("T")[0];
    
    return bookings.filter((booking) => {
      if (!booking || !booking.id || !booking.selectedDate) return false;
      
      if (bookingFilter === "today") {
        return booking.selectedDate === today;
      } else if (bookingFilter === "date" && bookingFilterDate) {
        return booking.selectedDate === bookingFilterDate;
      }
      
      return true; // "all" filter
    });
  };

  const filteredBookings = getFilteredBookings();

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  return (
    <>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <Label className="text-foreground text-sm">Filter:</Label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={bookingFilter === "all" ? "default" : "outline"}
            onClick={() => setBookingFilter("all")}
            className={bookingFilter === "all" ? "bg-primary" : ""}
          >
            All Bookings
          </Button>
          <Button
            size="sm"
            variant={bookingFilter === "today" ? "default" : "outline"}
            onClick={() => setBookingFilter("today")}
            className={bookingFilter === "today" ? "bg-primary" : ""}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={bookingFilter === "date" ? "default" : "outline"}
            onClick={() => setBookingFilter("date")}
            className={bookingFilter === "date" ? "bg-primary" : ""}
          >
            Specific Date
          </Button>
        </div>
        
        {bookingFilter === "date" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={bookingFilterDate}
              onChange={(e) => setBookingFilterDate(e.target.value)}
              className="w-auto border-border"
            />
          </div>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredBookings.length} booking(s)
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-2">
        {filteredBookings.map((booking) => {
          const bookingIdShort = booking.id.split("_")[1] || booking.id;
          const totalPassengers = booking.passengers?.length || 0;
          const checkedInCount = (booking.checkIns || []).filter(
            (checkInArray: any[]) => checkInArray && checkInArray.length > 0
          ).length;
          const isExpanded = expandedBookingId === booking.id;

          // Format date - compact version
          const dateObj = new Date(booking.selectedDate);
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });

          return (
            <Card
              key={booking.id}
              className="border-border hover:border-primary/30 transition-colors"
            >
              {/* Compact Header - Always Visible */}
              <button
                onClick={() => toggleExpand(booking.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left Section: ID, Name, Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-primary">
                        #{bookingIdShort}
                      </span>
                      <span className="text-foreground truncate">
                        {booking.contactInfo?.name || "N/A"}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Status, Price, Expand */}
                  <div className="flex items-center gap-3">
                    {/* Passengers */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground">{totalPassengers}</span>
                    </div>

                    {/* Price */}
                    <span className="text-sm text-primary">
                      €{booking.totalPrice?.toFixed(2) || "0.00"}
                    </span>

                    {/* Status Badge */}
                    {checkedInCount === 0 ? (
                      <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
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
                        Partial
                      </Badge>
                    )}

                    {/* Expand Icon */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                  <div className="grid gap-4 md:grid-cols-2 mt-3">
                    {/* Contact & Booking Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Contact</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground">
                            {booking.contactInfo?.email || "N/A"}
                          </span>
                        </div>
                        {booking.contactInfo?.phone && (
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-foreground">
                              {booking.contactInfo.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time Slot</p>
                        <p className="text-sm text-foreground">
                          {booking.timeSlot} - 8:00 PM
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check-in Status</p>
                        <p className="text-sm text-foreground">
                          {checkedInCount} of {totalPassengers} passengers checked in
                        </p>
                      </div>

                      {booking.guidedCommentary && (
                        <div className="rounded-md bg-accent/10 px-2 py-1.5 inline-flex">
                          <p className="text-xs text-accent">✓ Guided Commentary</p>
                        </div>
                      )}
                    </div>

                    {/* QR Codes Preview */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">QR Codes</p>
                      {!booking.qrCodes || booking.qrCodes.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            No QR codes available
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {booking.qrCodes.slice(0, 4).map((qrCode: string, index: number) => (
                            <div
                              key={index}
                              className="rounded-lg border border-border bg-white p-2"
                            >
                              <img
                                src={qrCode}
                                alt={`QR Code ${index + 1}`}
                                className="w-full"
                              />
                              <p className="mt-1 text-center text-xs text-muted-foreground">
                                Pass {index + 1}
                              </p>
                            </div>
                          ))}
                          {booking.qrCodes.length > 4 && (
                            <div className="col-span-2 text-center text-xs text-muted-foreground">
                              +{booking.qrCodes.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
