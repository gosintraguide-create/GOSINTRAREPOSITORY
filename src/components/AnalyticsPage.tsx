import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Package, CheckCircle2, Clock, Download, Filter, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from '../lib/apiErrorHandler';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface AnalyticsPageProps {
  onNavigate: (page: string) => void;
}

type TimeFrame = "7days" | "30days" | "3months" | "6months" | "1year" | "all" | "custom";

const CHART_COLORS = ["#0A4D5C", "#D97843", "#636e72", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#3498db"];

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  // Block search engines from indexing this page
  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
    document.title = 'Analytics - Access Restricted';
  }, []);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (result?.success && result.bookings) {
      const validBookings = result.bookings.filter(
        (booking: any) => booking && booking.id && booking.selectedDate
      );
      
      // Load check-in data for each booking
      const bookingsWithCheckIns = await Promise.all(
        validBookings.map(async (booking: any) => {
          const checkIns = await loadCheckInsForBooking(booking.id, booking.passengers?.length || 0);
          return { ...booking, checkIns };
        })
      );
      
      setBookings(bookingsWithCheckIns);
    } else if (!result) {
      // Only show error if we're in development or this is the first load
      if (window.location.hostname === 'localhost' && bookings.length === 0) {
        toast.error("Server unavailable. Analytics will be empty until server is deployed.");
      }
    }
    
    setLoading(false);
  };

  const loadCheckInsForBooking = async (bookingId: string, passengerCount: number) => {
    try {
      const checkIns = [];
      for (let i = 0; i < passengerCount; i++) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/checkin-status/${bookingId}_${i}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        checkIns.push(result.checkIns || []);
      }
      return checkIns;
    } catch (error) {
      console.error(`Error loading check-ins for ${bookingId}:`, error);
      return [];
    }
  };

  // Filter bookings by time frame
  const filteredBookings = useMemo(() => {
    if (bookings.length === 0) return [];

    const now = new Date();
    let startFilterDate: Date;

    switch (timeFrame) {
      case "7days":
        startFilterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startFilterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        startFilterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6months":
        startFilterDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        startFilterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!startDate || !endDate) return bookings;
        return bookings.filter(b => {
          const bookingDate = new Date(b.selectedDate);
          return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
        });
      case "all":
      default:
        return bookings;
    }

    return bookings.filter(b => {
      const bookingDate = new Date(b.selectedDate);
      return bookingDate >= startFilterDate;
    });
  }, [bookings, timeFrame, startDate, endDate]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (filteredBookings.length === 0) {
      return {
        totalRevenue: 0,
        totalBookings: 0,
        totalPassengers: 0,
        avgBookingValue: 0,
        checkInRate: 0,
        revenueByDay: [],
        revenueByMonth: [],
        bookingsByDay: [],
        bookingsByTicketType: [],
        bookingsByTimeSlot: [],
        attractionSales: [],
        revenueGrowth: 0,
        bookingGrowth: 0,
        topDays: [],
        passengerTypeDistribution: [],
        hourlyDistribution: [],
        weekdayDistribution: [],
        guidedVsStandard: [],
      };
    }

    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalBookings = filteredBookings.length;
    const totalPassengers = filteredBookings.reduce((sum, b) => sum + (b.passengers?.length || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Check-in rate
    const totalCheckedIn = filteredBookings.reduce((sum, b) => {
      return sum + (b.checkIns || []).filter((ci: any[]) => ci && ci.length > 0).length;
    }, 0);
    const checkInRate = totalPassengers > 0 ? (totalCheckedIn / totalPassengers) * 100 : 0;

    // Revenue by day
    const revenueByDayMap: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.selectedDate).toISOString().split('T')[0];
      revenueByDayMap[date] = (revenueByDayMap[date] || 0) + (b.totalPrice || 0);
    });
    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by month
    const revenueByMonthMap: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.selectedDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonthMap[month] = (revenueByMonthMap[month] || 0) + (b.totalPrice || 0);
    });
    const revenueByMonth = Object.entries(revenueByMonthMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Bookings by day
    const bookingsByDayMap: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.selectedDate).toISOString().split('T')[0];
      bookingsByDayMap[date] = (bookingsByDayMap[date] || 0) + 1;
    });
    const bookingsByDay = Object.entries(bookingsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Bookings by ticket type
    const ticketTypeCounts: { [key: string]: { count: number; revenue: number } } = {};
    filteredBookings.forEach(b => {
      b.passengers?.forEach((p: any) => {
        const type = p.type || 'Unknown';
        if (!ticketTypeCounts[type]) {
          ticketTypeCounts[type] = { count: 0, revenue: 0 };
        }
        ticketTypeCounts[type].count++;
        ticketTypeCounts[type].revenue += (b.totalPrice || 0) / (b.passengers?.length || 1);
      });
    });
    const bookingsByTicketType = Object.entries(ticketTypeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      revenue: data.revenue,
    }));

    // Bookings by time slot
    const timeSlotCounts: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const slot = b.timeSlot || 'Unknown';
      timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
    });
    const bookingsByTimeSlot = Object.entries(timeSlotCounts)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => a.slot.localeCompare(b.slot));

    // Attraction sales
    const attractionCounts: { [key: string]: { count: number; revenue: number } } = {};
    filteredBookings.forEach(b => {
      b.attractions?.forEach((a: any) => {
        if (!attractionCounts[a.id]) {
          attractionCounts[a.id] = { count: 0, revenue: 0 };
        }
        attractionCounts[a.id].count++;
        attractionCounts[a.id].revenue += a.price || 0;
      });
    });
    const attractionSales = Object.entries(attractionCounts).map(([id, data]) => ({
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.count,
      revenue: data.revenue,
    }));

    // Growth calculations (compare first half vs second half)
    const midPoint = Math.floor(filteredBookings.length / 2);
    const firstHalf = filteredBookings.slice(0, midPoint);
    const secondHalf = filteredBookings.slice(midPoint);
    
    const firstHalfRevenue = firstHalf.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const revenueGrowth = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    const bookingGrowth = firstHalf.length > 0
      ? ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
      : 0;

    // Top performing days
    const topDays = Object.entries(revenueByDayMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Passenger type distribution
    const passengerTypeDist: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      b.passengers?.forEach((p: any) => {
        const type = p.type || 'Unknown';
        passengerTypeDist[type] = (passengerTypeDist[type] || 0) + 1;
      });
    });
    const passengerTypeDistribution = Object.entries(passengerTypeDist).map(([type, count]) => ({
      type,
      count,
      percentage: totalPassengers > 0 ? (count / totalPassengers) * 100 : 0,
    }));

    // Hourly distribution
    const hourlyDist: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const hour = b.timeSlot?.split(':')[0] || 'Unknown';
      hourlyDist[hour] = (hourlyDist[hour] || 0) + 1;
    });
    const hourlyDistribution = Object.entries(hourlyDist)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Weekday distribution
    const weekdayDist: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.selectedDate);
      const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      weekdayDist[weekday] = (weekdayDist[weekday] || 0) + 1;
    });
    const weekdayDistribution = Object.entries(weekdayDist).map(([day, count]) => ({ day, count }));

    // Guided vs Standard
    const guidedCount = filteredBookings.filter(b => b.guidedTour).length;
    const standardCount = filteredBookings.length - guidedCount;
    const guidedVsStandard = [
      { type: 'Guided Tour', count: guidedCount },
      { type: 'Standard Pass', count: standardCount },
    ];

    return {
      totalRevenue,
      totalBookings,
      totalPassengers,
      avgBookingValue,
      checkInRate,
      revenueByDay,
      revenueByMonth,
      bookingsByDay,
      bookingsByTicketType,
      bookingsByTimeSlot,
      attractionSales,
      revenueGrowth,
      bookingGrowth,
      topDays,
      passengerTypeDistribution,
      hourlyDistribution,
      weekdayDistribution,
      guidedVsStandard,
    };
  }, [filteredBookings]);

  const exportData = () => {
    const data = {
      timeFrame,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: analytics.totalRevenue,
        totalBookings: analytics.totalBookings,
        totalPassengers: analytics.totalPassengers,
        avgBookingValue: analytics.avgBookingValue,
        checkInRate: analytics.checkInRate,
        revenueGrowth: analytics.revenueGrowth,
        bookingGrowth: analytics.bookingGrowth,
      },
      detailedData: {
        revenueByDay: analytics.revenueByDay,
        bookingsByTicketType: analytics.bookingsByTicketType,
        attractionSales: analytics.attractionSales,
        topDays: analytics.topDays,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeFrame}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Analytics data exported successfully!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => onNavigate("admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-foreground">Advanced Analytics</h1>
              </div>
              <div className="h-1 w-20 rounded-full bg-accent" />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={loadBookings} 
                variant="outline" 
                className="gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button onClick={exportData} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Time Frame Filter */}
        <Card className="mb-6 border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-foreground">Time Frame</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-foreground">Select Period</Label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
                className="mt-2 w-full rounded-md border border-border bg-input-background px-3 py-2 text-foreground"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {timeFrame === "custom" && (
              <>
                <div>
                  <Label className="text-foreground">Start Date</Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">End Date</Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-2 w-full rounded-md border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Revenue</p>
                <p className="mt-2 text-foreground text-3xl">€{analytics.totalRevenue.toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {analytics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Bookings</p>
                <p className="mt-2 text-foreground text-3xl">{analytics.totalBookings}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {analytics.bookingGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={analytics.bookingGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {Math.abs(analytics.bookingGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Passengers</p>
                <p className="mt-2 text-foreground text-3xl">{analytics.totalPassengers}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Avg: {(analytics.totalPassengers / (analytics.totalBookings || 1)).toFixed(1)} per booking
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Avg Booking Value</p>
                <p className="mt-2 text-foreground text-3xl">€{analytics.avgBookingValue.toFixed(2)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check-in rate: {analytics.checkInRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Trends */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Revenue Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e3" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f0e9e3',
                    borderRadius: '8px' 
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#0A4D5C" fill="#0A4D5C" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Bookings Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.bookingsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e3" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f0e9e3',
                    borderRadius: '8px' 
                  }} 
                />
                <Bar dataKey="count" fill="#D97843" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Ticket Types & Time Slots */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Passenger Types</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={analytics.passengerTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.type}: ${entry.percentage.toFixed(0)}%`}
                >
                  {analytics.passengerTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </Card>

          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Popular Time Slots</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.bookingsByTimeSlot}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e3" />
                <XAxis dataKey="slot" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f0e9e3',
                    borderRadius: '8px' 
                  }} 
                />
                <Bar dataKey="count" fill="#0A4D5C" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Attraction Sales & Weekday Distribution */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Attraction Ticket Sales</h3>
            </div>
            <div className="space-y-3">
              {analytics.attractionSales.length > 0 ? (
                analytics.attractionSales.map((attr, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <div>
                      <p className="text-foreground">{attr.name}</p>
                      <p className="text-sm text-muted-foreground">{attr.count} tickets sold</p>
                    </div>
                    <p className="text-primary">€{attr.revenue.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No attraction tickets sold yet</p>
              )}
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">Bookings by Weekday</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weekdayDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e9e3" />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #f0e9e3',
                    borderRadius: '8px' 
                  }} 
                />
                <Bar dataKey="count" fill="#D97843" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Performing Days */}
        <Card className="mb-6 border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-foreground">Top 5 Revenue Days</h3>
          </div>
          <div className="space-y-3">
            {analytics.topDays.map((day, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-primary text-xl">€{day.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Guided vs Standard */}
        <Card className="border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-foreground">Guided Tour vs Standard Pass</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={analytics.guidedVsStandard}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analytics.guidedVsStandard.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
