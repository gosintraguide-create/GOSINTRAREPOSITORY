import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  FileText,
  Search,
  Calendar,
  Users,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface TripRecord {
  id: string;
  timestamp: string;
  pickupLocation: string;
  destination: string;
  groupSize: number;
  status: string;
}

interface BookingLog {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  purchaseDate: string;
  passDate: string;
  totalPrice: number;
  passes: number;
  guidedTour: boolean;
  attractions: string[];
  trips: TripRecord[];
  checkInCount: number;
}

export function BookingLogs() {
  const [logs, setLogs] = useState<BookingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

  const loadBookingLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/booking-logs`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.logs) {
          setLogs(result.logs);
        } else {
          toast.error("Failed to load booking logs");
        }
      } else {
        toast.error("Error loading booking logs");
      }
    } catch (error) {
      console.error("Error loading booking logs:", error);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingLogs();
  }, []);

  const toggleBookingExpansion = (bookingId: string) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedBookings(newExpanded);
  };

  const exportToCSV = () => {
    const headers = [
      "Booking Code",
      "Customer Name",
      "Email",
      "Phone",
      "Purchase Date",
      "Pass Date",
      "Passes",
      "Price",
      "Guided Tour",
      "Attractions",
      "Total Trips",
      "Check-ins",
      "Status"
    ];

    const rows = filteredAndSortedLogs.map(log => [
      log.bookingCode,
      log.customerName,
      log.customerEmail,
      log.customerPhone,
      new Date(log.purchaseDate).toLocaleDateString(),
      new Date(log.passDate).toLocaleDateString(),
      log.passes,
      `€${log.totalPrice.toFixed(2)}`,
      log.guidedTour ? "Yes" : "No",
      log.attractions.join("; "),
      log.trips.length,
      log.checkInCount,
      log.checkInCount === 0 ? "Pending" : log.checkInCount === log.passes ? "Complete" : "Partial"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `booking-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Logs exported successfully");
  };

  // Filter and sort logs
  const filteredAndSortedLogs = logs
    .filter(log => {
      const matchesSearch = 
        searchTerm === "" ||
        log.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterStatus === "all" ||
        (filterStatus === "pending" && log.checkInCount === 0) ||
        (filterStatus === "partial" && log.checkInCount > 0 && log.checkInCount < log.passes) ||
        (filterStatus === "complete" && log.checkInCount === log.passes);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case "date-asc":
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        case "trips-desc":
          return b.trips.length - a.trips.length;
        case "trips-asc":
          return a.trips.length - b.trips.length;
        case "price-desc":
          return b.totalPrice - a.totalPrice;
        case "price-asc":
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

  const stats = {
    totalBookings: logs.length,
    totalTrips: logs.reduce((sum, log) => sum + log.trips.length, 0),
    totalRevenue: logs.reduce((sum, log) => sum + log.totalPrice, 0),
    avgTripsPerBooking: logs.length > 0 ? (logs.reduce((sum, log) => sum + log.trips.length, 0) / logs.length).toFixed(1) : "0",
    completedBookings: logs.filter(log => log.checkInCount === log.passes).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground">Booking Logs</h2>
          <p className="text-muted-foreground">
            Track all bookings and analyze service usage patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadBookingLogs}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={exportToCSV}
            className="gap-2 bg-accent hover:bg-accent/90"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">Total Bookings</p>
              <p className="text-foreground">{stats.totalBookings}</p>
            </div>
          </div>
        </Card>

        <Card className="border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-muted-foreground">Total Trips</p>
              <p className="text-foreground">{stats.totalTrips}</p>
            </div>
          </div>
        </Card>

        <Card className="border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground">Avg Trips/Booking</p>
              <p className="text-foreground">{stats.avgTripsPerBooking}</p>
            </div>
          </div>
        </Card>

        <Card className="border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="text-foreground">{stats.completedBookings}</p>
            </div>
          </div>
        </Card>

        <Card className="border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="text-foreground">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Booking code, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">Status Filter</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filter-status" className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-by">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="trips-desc">Most Trips</SelectItem>
                <SelectItem value="trips-asc">Least Trips</SelectItem>
                <SelectItem value="price-desc">Highest Price</SelectItem>
                <SelectItem value="price-asc">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredAndSortedLogs.length === 0 ? (
          <Card className="border-border p-8 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-foreground">No Bookings Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "No booking logs available yet"}
            </p>
          </Card>
        ) : (
          filteredAndSortedLogs.map((log) => {
            const isExpanded = expandedBookings.has(log.bookingId);
            const statusBadge =
              log.checkInCount === 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
              ) : log.checkInCount === log.passes ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">Complete</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-yellow-600">
                    {log.checkInCount}/{log.passes} Used
                  </span>
                </div>
              );

            return (
              <Card key={log.bookingId} className="border-border overflow-hidden">
                {/* Main Info */}
                <button
                  onClick={() => toggleBookingExpansion(log.bookingId)}
                  className="w-full p-4 text-left transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="rounded bg-primary/10 px-2 py-1 font-mono text-primary">
                          {log.bookingCode}
                        </span>
                        {statusBadge}
                        <span className="text-muted-foreground">
                          {log.trips.length} {log.trips.length === 1 ? "trip" : "trips"}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-foreground">{log.customerName}</p>
                          <p className="text-muted-foreground">{log.customerEmail}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Pass Date: {new Date(log.passDate).toLocaleDateString()}</p>
                          <p>{log.passes} {log.passes === 1 ? "pass" : "passes"} • €{log.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                  <div className="border-t border-border bg-secondary/20 p-4 space-y-4">
                    {/* Booking Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-foreground">Booking Details</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Phone:</span> {log.customerPhone}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Purchase:</span>{" "}
                            {new Date(log.purchaseDate).toLocaleString()}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Type:</span>{" "}
                            {log.guidedTour ? "Insight Tour" : "Standard Pass"}
                          </p>
                          {log.attractions.length > 0 && (
                            <p className="text-muted-foreground">
                              <span className="text-foreground">Attractions:</span>{" "}
                              {log.attractions.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-foreground">Usage Stats</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Check-ins:</span> {log.checkInCount} / {log.passes}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Total Trips:</span> {log.trips.length}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Utilization:</span>{" "}
                            {log.passes > 0 ? Math.round((log.checkInCount / log.passes) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trip Records */}
                    {log.trips.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-foreground">Trip History</h4>
                        <div className="space-y-2">
                          {log.trips.map((trip) => (
                            <div
                              key={trip.id}
                              className="flex items-center justify-between rounded-lg border border-border bg-white p-3"
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-accent" />
                                <div>
                                  <p className="text-foreground">
                                    {trip.pickupLocation}
                                    {trip.destination && ` → ${trip.destination}`}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {trip.groupSize} {trip.groupSize === 1 ? "passenger" : "passengers"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <p>{new Date(trip.timestamp).toLocaleDateString()}</p>
                                <p>{new Date(trip.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
