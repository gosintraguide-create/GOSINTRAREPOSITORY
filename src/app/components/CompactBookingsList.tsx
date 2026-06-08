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
  RefreshCw,
  MailCheck,
  MailX,
  MapPin,
  Ban,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface CompactBookingsListProps {
  bookings: any[];
  onRefresh?: () => void;
}

// Human-readable pickup location labels (mirrors the edge function map)
const PICKUP_LABELS: Record<string, string> = {
  "sintra-train-station": "Sintra Train Station",
  "sintra-village": "Sintra Village / Town Hall",
  "hotel-tivoli-palacio": "Hotel Tivoli Palácio",
  "hotel-lawrence": "Hotel Lawrence",
  "quinta-da-regaleira": "Quinta da Regaleira entrance",
  "pena-palace-base": "Pena Palace base stop",
  "moorish-castle-base": "Moorish Castle base stop",
  "monserrate-palace": "Monserrate Palace",
  "cabo-da-roca": "Cabo da Roca",
  "colares": "Colares",
  "azenhas-do-mar": "Azenhas do Mar",
};

function pickupLabel(raw: string | undefined): string {
  if (!raw) return "—";
  return PICKUP_LABELS[raw] || raw;
}

// Status pill config
const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  confirmed:  { label: "Confirmed",  badge: "bg-blue-100 text-blue-700 border-blue-300" },
  completed:  { label: "Completed",  badge: "bg-green-100 text-green-700 border-green-300" },
  cancelled:  { label: "Cancelled",  badge: "bg-red-100 text-red-600 border-red-300" },
};

export function CompactBookingsList({ bookings, onRefresh }: CompactBookingsListProps) {
  const [bookingFilter, setBookingFilter] = useState<"upcoming" | "today" | "all" | "date">("upcoming");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "completed" | "cancelled">("all");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  // Track optimistic local status changes while the API call is in flight
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // ── Resend email ──────────────────────────────────────────────────────────
  const handleResendEmail = async (bookingId: string) => {
    setResendingEmail(bookingId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${bookingId}/resend-email`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
        },
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Confirmation email resent");
      } else {
        toast.error(`Failed to resend email: ${result.error || "Unknown error"}`);
      }
    } catch {
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setResendingEmail(null);
    }
  };

  // ── Update booking status ─────────────────────────────────────────────────
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    setLocalStatuses((prev) => ({ ...prev, [bookingId]: newStatus }));
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`Booking marked as ${newStatus}`);
        onRefresh?.();
      } else {
        toast.error(data.error || "Failed to update status");
        // Revert optimistic update
        setLocalStatuses((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
      }
    } catch {
      toast.error("Network error — status not saved");
      setLocalStatuses((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const getFilteredBookings = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayTime = new Date(today).getTime();

    let filtered = bookings.filter((booking) => {
      if (!booking || !booking.id || !booking.selectedDate) return false;

      // Resolve effective status (optimistic local override)
      const effectiveStatus = localStatuses[booking.id] ?? booking.status ?? "confirmed";

      // Status chip filter
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !booking.id.toLowerCase().includes(q) &&
          !booking.contactInfo?.name?.toLowerCase().includes(q)
        ) return false;
      }

      const bookingDate = booking.selectedDate;
      const bookingTime = new Date(bookingDate).getTime();
      if (bookingFilter === "today") return bookingDate === today;
      if (bookingFilter === "upcoming") return bookingTime >= todayTime;
      if (bookingFilter === "date" && selectedCalendarDate) {
        return bookingDate === selectedCalendarDate.toISOString().split("T")[0];
      }
      return true;
    });

    filtered.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const toggleExpand = (id: string) =>
    setExpandedBookingId(expandedBookingId === id ? null : id);

  const isNewBooking = (booking: any) => {
    if (!booking.createdAt) return false;
    return Date.now() - new Date(booking.createdAt).getTime() < 30 * 60 * 1000;
  };

  const formatCalendarDate = (date: Date | undefined) =>
    date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pick a date";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by booking ID or customer name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <Label className="text-foreground text-sm font-semibold">Show:</Label>
        <div className="flex gap-2 flex-wrap">
          {(["upcoming", "today", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={bookingFilter === f ? "default" : "outline"}
              onClick={() => { setBookingFilter(f); setSelectedCalendarDate(undefined); }}
              className={bookingFilter === f ? "bg-primary capitalize" : "capitalize"}
            >
              {f === "all" ? "All Time" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}

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
                onSelect={(date) => { setSelectedCalendarDate(date); setBookingFilter("date"); setCalendarOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {bookingFilter === "date" && selectedCalendarDate && (
            <Button size="sm" variant="ghost" onClick={() => { setSelectedCalendarDate(undefined); setBookingFilter("upcoming"); }} className="gap-1">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {([
            { value: "all", label: "All" },
            { value: "confirmed", label: "Confirmed" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ] as const).map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
              className={`text-xs h-7 px-2.5 ${statusFilter === value ? "bg-primary" : ""}`}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="ml-auto text-sm text-muted-foreground">{filteredBookings.length} booking(s)</div>
      </div>

      {/* List */}
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
                    : "No bookings yet"}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            // Resolve short display ID
            let bookingIdShort = booking.id;
            if (/^\d{13}/.test(booking.id)) bookingIdShort = booking.id.slice(-6);
            else if (booking.id.includes("_")) bookingIdShort = booking.id.split("_")[1];

            const totalPassengers = booking.passengers?.length || 0;
            const checkedInCount = (booking.checkIns || []).filter(
              (arr: any[]) => arr && arr.length > 0,
            ).length;

            const dateObj = new Date(booking.selectedDate);
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });

            const isExpanded = expandedBookingId === booking.id;

            // Resolve status: local optimistic override → stored → derive from check-ins
            const effectiveStatus: string =
              localStatuses[booking.id] ??
              booking.status ??
              (checkedInCount === totalPassengers && totalPassengers > 0 ? "completed" : "confirmed");

            const isCancelled = effectiveStatus === "cancelled";

            // Pickup location (bookings store it as `pickupLocation`)
            const pickup = booking.pickupLocation || booking.firstPickupLocation;

            return (
              <Card
                key={booking.id}
                className={`border-border transition-opacity ${isCancelled ? "opacity-60" : ""} ${isNewBooking(booking) ? "border-l-4 border-l-accent" : ""}`}
              >
                {/* ── Compact header ── */}
                <button
                  onClick={() => toggleExpand(booking.id)}
                  className="w-full p-4 text-left hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: ID · Name · Date · Time · Pickup */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 flex-1 min-w-0">
                      <span className={`font-mono text-lg font-semibold ${isCancelled ? "text-muted-foreground line-through" : "text-primary"}`}>
                        #{bookingIdShort}
                      </span>
                      {isNewBooking(booking) && (
                        <Badge className="bg-accent text-white gap-1 text-xs">
                          <Sparkles className="h-3 w-3" /> NEW
                        </Badge>
                      )}
                      <div className="h-4 w-px bg-border" />
                      <span className="text-foreground font-medium truncate max-w-[120px]">
                        {booking.contactInfo?.name || "N/A"}
                      </span>
                      {/* Date + time — hide on very small screens */}
                      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-px bg-border" />
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                        <Clock className="h-3.5 w-3.5 ml-1" />
                        <span>{booking.timeSlot || "—"}</span>
                      </div>
                      {/* Pickup — always visible if set */}
                      {pickup && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className="hidden sm:block h-4 w-px bg-border" />
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{pickupLabel(pickup)}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: status badge + chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isCancelled ? (
                        <Badge variant="outline" className={STATUS_CONFIG.cancelled.badge + " gap-1"}>
                          <Ban className="h-3 w-3" /> Cancelled
                        </Badge>
                      ) : effectiveStatus === "completed" ? (
                        <Badge variant="outline" className={STATUS_CONFIG.completed.badge + " gap-1"}>
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </Badge>
                      ) : checkedInCount > 0 && checkedInCount < totalPassengers ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 gap-1">
                          <AlertCircle className="h-3 w-3" /> {checkedInCount}/{totalPassengers}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: contact + date/time + pickup */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Contact</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{booking.contactInfo?.email || "N/A"}</span>
                            </div>
                            {booking.contactInfo?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{booking.contactInfo.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tour date + departure slot + booked-at */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Tour date</p>
                              <div className="flex items-center gap-1.5 text-sm text-foreground mt-0.5">
                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Departure</p>
                              <div className="flex items-center gap-1.5 text-sm text-foreground mt-0.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium">{booking.timeSlot || "—"}</span>
                              </div>
                            </div>
                          </div>
                          {booking.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Booked{" "}
                              {new Date(booking.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {" at "}
                              {new Date(booking.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>

                        {/* Pickup location */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pickup location</p>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-foreground font-medium">{pickupLabel(pickup)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: price + passengers + check-ins + extras */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                          <p className={`text-2xl font-semibold ${isCancelled ? "text-muted-foreground line-through" : "text-primary"}`}>
                            €{booking.totalPrice?.toFixed(2) || "0.00"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Passengers</p>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{totalPassengers}</span>
                            <span className="text-muted-foreground text-sm">{totalPassengers === 1 ? "guest" : "guests"}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check-ins</p>
                          <p className="text-sm">{checkedInCount} of {totalPassengers} checked in</p>
                        </div>

                        {booking.guidedCommentary && (
                          <div className="rounded-md bg-accent/10 px-3 py-2 inline-flex">
                            <p className="text-sm text-accent font-medium">✓ Guided Commentary</p>
                          </div>
                        )}

                        {booking.selectedAttractions?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Attractions</p>
                            <div className="space-y-1">
                              {booking.selectedAttractions.map((attr: any, i: number) => (
                                <p key={i} className="text-sm">• {attr.name}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Status controls ── */}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Change status</p>
                      <div className="flex flex-wrap gap-2">
                        {effectiveStatus !== "completed" && !isCancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                            disabled={updatingStatus === booking.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, "completed"); }}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark as Completed
                          </Button>
                        )}
                        {!isCancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                            disabled={updatingStatus === booking.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, "cancelled"); }}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancel booking
                          </Button>
                        )}
                        {(isCancelled || effectiveStatus === "completed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-muted-foreground"
                            disabled={updatingStatus === booking.id}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, "confirmed"); }}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore to Confirmed
                          </Button>
                        )}
                        {updatingStatus === booking.id && (
                          <span className="text-xs text-muted-foreground self-center">Saving…</span>
                        )}
                      </div>
                    </div>

                    {/* ── Email section ── */}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          {booking.emailSent === true ? (
                            <><MailCheck className="h-4 w-4 text-green-600" /><span className="text-sm">Confirmation email sent</span></>
                          ) : booking.emailSent === false ? (
                            <>
                              <MailX className="h-4 w-4 text-red-600" />
                              <span className="text-sm">Email failed to send</span>
                              {booking.emailError && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">{booking.emailError}</Badge>
                              )}
                            </>
                          ) : (
                            <><AlertCircle className="h-4 w-4 text-yellow-600" /><span className="text-sm text-muted-foreground">Email status unknown</span></>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleResendEmail(booking.id); }}
                          disabled={resendingEmail === booking.id}
                          className="gap-2"
                        >
                          {resendingEmail === booking.id ? (
                            <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                          ) : (
                            <><Mail className="h-3.5 w-3.5" /> Resend Email</>
                          )}
                        </Button>
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
