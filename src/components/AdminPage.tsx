import { useState, useEffect, useMemo } from "react";
import {
  Settings,
  Lock,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Save,
  Eye,
  EyeOff,
  Package,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar as CalendarIconMetrics,
  MessageCircle,
  Send,
  UserCog,
  Navigation,
  RefreshCw,
  Tag,
  MoreHorizontal,
  FileText,
  Image,
} from "lucide-react";
import { DestinationTracker } from './DestinationTracker';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  loadContent,
  saveContent,
  saveContentAsync,
  DEFAULT_CONTENT,
  type WebsiteContent,
} from "../lib/contentManager";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from "../lib/apiErrorHandler";
import { ContentEditor } from "./ContentEditor";
import { BlogEditor } from "./BlogEditor";
import { SEOTools } from "./SEOTools";
import { DriverManagement } from "./DriverManagementMobile";
import { PickupRequestsManagement } from "./PickupRequestsManagement";
import { TagManagement } from "./TagManagement";
import { ImageManager } from "./ImageManager";
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
} from "recharts";

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

interface PricingSettings {
  basePrice: number;
  guidedTourSurcharge: number;
  attractions: {
    [key: string]: { name: string; price: number };
  };
}

interface AvailabilitySettings {
  [date: string]: {
    [timeSlot: string]: number;
  };
}

const DEFAULT_PRICING: PricingSettings = {
  basePrice: 25,
  guidedTourSurcharge: 5,
  attractions: {
    "pena-palace-park": {
      name: "Pena Palace Park Only",
      price: 8,
    },
    "pena-palace-full": {
      name: "Pena Palace & Park",
      price: 14,
    },
    "quinta-regaleira": {
      name: "Quinta da Regaleira",
      price: 12,
    },
    "moorish-castle": { name: "Moorish Castle", price: 10 },
    "monserrate-palace": {
      name: "Monserrate Palace",
      price: 10,
    },
    "sintra-palace": {
      name: "Sintra National Palace",
      price: 10,
    },
  },
};

const TIME_SLOTS = [
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];
const CHART_COLORS = [
  "#0A4D5C",
  "#D97843",
  "#636e72",
  "#2ecc71",
  "#f39c12",
  "#e74c3c",
];

export function AdminPage({ onNavigate }: AdminPageProps) {
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
    document.title = 'Admin Portal - Access Restricted';
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check for existing session in localStorage (persistent across browser sessions)
    const session = localStorage.getItem("admin-session");
    return session === "authenticated";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pricing, setPricing] =
    useState<PricingSettings>(DEFAULT_PRICING);
  const [availability, setAvailability] =
    useState<AvailabilitySettings>({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState<WebsiteContent>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [savingAvailability, setSavingAvailability] =
    useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<string | null>(null);
  const [conversationMessages, setConversationMessages] =
    useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [loadingConversations, setLoadingConversations] =
    useState(false);
  const [activeTab, setActiveTab] = useState("pickups");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Load settings from database and localStorage
  useEffect(() => {
    // Load pricing from database
    async function loadPricingFromDB() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...data.pricing.attractions,
              },
            });
            // Also save to localStorage for offline use
            localStorage.setItem(
              "admin-pricing",
              JSON.stringify(data.pricing),
            );
            console.log("✅ Loaded pricing from database");
            return;
          }
        }
      } catch (error) {
        // Silently handle error - backend may not be available
      }

      // Fallback to localStorage if database fetch fails
      const savedPricing =
        localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          setPricing(JSON.parse(savedPricing));
          console.log("ℹ️ Using saved pricing");
        } catch (e) {
          console.log("ℹ️ Using default pricing");
        }
      }
    }

    loadPricingFromDB();

    // Load website content
    setContent(loadContent());
  }, []);

  // Load availability and bookings from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAvailability();
      loadBookings();
    }
  }, [isAuthenticated]);

  const loadAvailability = async () => {
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success && result.availability) {
      setAvailability(result.availability);
    }
  };

  const handleLogin = () => {
    // Simple demo password - in production, use proper authentication
    if (password === "gosintra2025") {
      setIsAuthenticated(true);
      localStorage.setItem("admin-session", "authenticated");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const saveSettings = async () => {
    try {
      // Save to localStorage for backward compatibility
      localStorage.setItem(
        "admin-pricing",
        JSON.stringify(pricing),
      );

      // Save to database for persistence across deployments
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pricing),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save pricing to database");
      }

      toast.success("Settings saved successfully to database!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        "Failed to save settings to database. Saved locally only.",
      );
    }
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      // Save availability to localStorage for backward compatibility
      localStorage.setItem(
        "admin-availability",
        JSON.stringify(availability),
      );

      // Save each date's availability to backend
      const dates = Object.keys(availability);
      for (const date of dates) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/availability/${date}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(availability[date]),
          },
        );

        const result = await response.json();
        if (!result.success) {
          console.error(
            `Failed to save availability for ${date}:`,
            result.error,
          );
        }
      }

      toast.success("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  const saveContentSettings = async () => {
    try {
      const result = await saveContentAsync(content);

      if (result.success) {
        toast.success(
          "Content saved successfully to database!",
        );
      } else {
        toast.error(
          `Failed to save to database: ${result.error}. Saved locally only.`,
        );
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content. Please try again.");
    }
  };

  const resetContent = async () => {
    if (
      confirm(
        "Are you sure you want to reset all content to defaults? This cannot be undone.",
      )
    ) {
      setContent(DEFAULT_CONTENT);

      try {
        const result = await saveContentAsync(DEFAULT_CONTENT);

        if (result.success) {
          toast.success(
            "Content reset to defaults and saved to database!",
          );
        } else {
          toast.error(
            `Content reset locally but database save failed: ${result.error}`,
          );
        }
      } catch (error) {
        console.error("Error resetting content:", error);
        toast.error(
          "Content reset locally but database save failed.",
        );
      }
    }
  };

  const updateAttractionPrice = (id: string, price: number) => {
    setPricing((prev) => ({
      ...prev,
      attractions: {
        ...prev.attractions,
        [id]: { ...prev.attractions[id], price },
      },
    }));
  };

  const updateAvailability = (
    date: string,
    timeSlot: string,
    seats: number,
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [timeSlot]: seats,
      },
    }));
  };

  const getAvailability = (
    date: string,
    timeSlot: string,
  ): number => {
    return availability[date]?.[timeSlot] ?? 50; // Default 50 seats
  };

  const setAllSlotsForDate = (date: string, seats: number) => {
    const dateAvailability: { [key: string]: number } = {};
    TIME_SLOTS.forEach((slot) => {
      dateAvailability[slot] = seats;
    });
    setAvailability((prev) => ({
      ...prev,
      [date]: dateAvailability,
    }));
  };

  const loadBookings = async () => {
    setLoadingBookings(true);

    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success && result.bookings) {
      // Filter out any null or invalid bookings
      const validBookings = result.bookings.filter(
        (booking: any) =>
          booking && booking.id && booking.selectedDate,
      );

      // Load check-in data for each booking
      const bookingsWithCheckIns = await Promise.all(
        validBookings.map(async (booking: any) => {
          const checkIns = await loadCheckInsForBooking(
            booking.id,
            booking.passengers?.length || 0,
          );
          return { ...booking, checkIns };
        }),
      );

      setBookings(bookingsWithCheckIns);
      console.log(`✅ Loaded ${bookingsWithCheckIns.length} bookings with check-in data`);
    } else {
      setBookings([]);
      console.log('ℹ️ No bookings found');
    }

    setLoadingBookings(false);
  };

  const loadCheckInsForBooking = async (
    bookingId: string,
    passengerCount: number,
  ) => {
    const checkIns: any[] = [];

    for (let i = 0; i < passengerCount; i++) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/checkins/${bookingId}/${i}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();
        if (result.success && result.checkIns) {
          checkIns[i] = result.checkIns;
        } else {
          checkIns[i] = [];
        }
      } catch (error) {
        checkIns[i] = [];
      }
    }

    return checkIns;
  };

  // Load bookings when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
      loadConversations();
    }
  }, [isAuthenticated]);

  // Chat functions
  const loadConversations = async () => {
    setLoadingConversations(true);

    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/conversations`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success && result.conversations) {
      setConversations(result.conversations);
    }

    setLoadingConversations(false);
  };

  const loadConversationMessages = async (
    conversationId: string,
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (result.success && result.messages) {
        setConversationMessages(result.messages);

        // Mark as read
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/mark-read`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        // Refresh conversations list to update unread count
        loadConversations();
      }
    } catch (error) {
      console.error(
        "Error loading conversation messages:",
        error,
      );
    }
  };

  const sendAdminReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    const messageText = replyMessage.trim();
    setReplyMessage("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: selectedConversation,
            sender: "admin",
            senderName: "Go Sintra Team",
            message: messageText,
          }),
        },
      );

      const result = await response.json();
      if (result.success && result.message) {
        setConversationMessages((prev) => [
          ...prev,
          result.message,
        ]);
        toast.success("Reply sent!");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        toast.success("Conversation closed");
        loadConversations();
      }
    } catch (error) {
      console.error("Error closing conversation:", error);
      toast.error("Failed to close conversation");
    }
  };

  // ====== METRICS & ANALYTICS CALCULATIONS ======
  const metrics = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        totalRevenue: 0,
        totalBookings: 0,
        totalPassengers: 0,
        averageBookingValue: 0,
        checkInRate: 0,
        revenueByDate: [],
        bookingsByTicketType: [],
        popularAttractions: [],
        revenueByMonth: [],
        checkInStats: { checked: 0, pending: 0, partial: 0 },
        upcomingBookings: [],
        recentBookings: [],
        todaysBookings: [],
        todayStats: {
          totalBookings: 0,
          totalPassengers: 0,
          checkedIn: 0,
          pending: 0,
          revenue: 0,
          checkInRate: 0,
        },
      };
    }

    // Total metrics
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0,
    );
    const totalBookings = bookings.length;
    const totalPassengers = bookings.reduce(
      (sum, b) => sum + (b.passengers?.length || 0),
      0,
    );
    const averageBookingValue = totalRevenue / totalBookings;

    // Check-in statistics
    let totalCheckedIn = 0;
    let totalPending = 0;
    let fullyCheckedIn = 0;
    let partiallyCheckedIn = 0;

    bookings.forEach((booking) => {
      const total = booking.passengers?.length || 0;
      const checked = (booking.checkIns || []).filter(
        (checkInArray: any[]) =>
          checkInArray && checkInArray.length > 0,
      ).length;

      totalCheckedIn += checked;
      totalPending += total - checked;

      if (checked === total && total > 0) {
        fullyCheckedIn++;
      } else if (checked > 0) {
        partiallyCheckedIn++;
      }
    });

    const checkInRate =
      totalPassengers > 0
        ? (totalCheckedIn / totalPassengers) * 100
        : 0;

    // Revenue by date (last 30 days)
    const dateRevenueMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const date = booking.selectedDate;
      dateRevenueMap.set(
        date,
        (dateRevenueMap.get(date) || 0) +
          (booking.totalPrice || 0),
      );
    });

    const revenueByDate = Array.from(dateRevenueMap.entries())
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Revenue by month
    const monthRevenueMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const month = new Date(
        booking.selectedDate,
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthRevenueMap.set(
        month,
        (monthRevenueMap.get(month) || 0) +
          (booking.totalPrice || 0),
      );
    });

    const revenueByMonth = Array.from(monthRevenueMap.entries())
      .map(([month, revenue]) => ({
        month,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // Bookings by ticket type
    let guidedCount = 0;
    let standardCount = 0;

    bookings.forEach((booking) => {
      if (booking.guidedCommentary) {
        guidedCount++;
      } else {
        standardCount++;
      }
    });

    const bookingsByTicketType = [
      {
        type: "Standard",
        count: standardCount,
        percentage: (standardCount / totalBookings) * 100,
      },
      {
        type: "Guided",
        count: guidedCount,
        percentage: (guidedCount / totalBookings) * 100,
      },
    ];

    // Popular attractions
    const attractionCountMap = new Map<string, number>();
    bookings.forEach((booking) => {
      if (booking.addons && Array.isArray(booking.addons)) {
        booking.addons.forEach((addon: string) => {
          const name =
            DEFAULT_PRICING.attractions[addon]?.name || addon;
          attractionCountMap.set(
            name,
            (attractionCountMap.get(name) || 0) + 1,
          );
        });
      }
    });

    const popularAttractions = Array.from(
      attractionCountMap.entries(),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Today's bookings
    const today = new Date().toISOString().split("T")[0];
    const todaysBookings = bookings.filter(
      (b) => b.selectedDate === today,
    );

    // Today's stats
    const todayTotalPassengers = todaysBookings.reduce(
      (sum, b) => sum + (b.passengers?.length || 0),
      0,
    );
    const todayCheckedIn = todaysBookings.reduce((sum, b) => {
      const checked = (b.checkIns || []).filter(
        (checkInArray: any[]) =>
          checkInArray && checkInArray.length > 0,
      ).length;
      return sum + checked;
    }, 0);
    const todayRevenue = todaysBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0,
    );

    // Upcoming bookings (future dates)
    const upcomingBookings = bookings
      .filter((b) => b.selectedDate >= today)
      .sort((a, b) =>
        a.selectedDate.localeCompare(b.selectedDate),
      )
      .slice(0, 5);

    // Recent bookings (most recent created)
    const recentBookings = [...bookings]
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);

    return {
      totalRevenue,
      totalBookings,
      totalPassengers,
      averageBookingValue,
      checkInRate,
      revenueByDate,
      bookingsByTicketType,
      popularAttractions,
      revenueByMonth,
      checkInStats: {
        checked: fullyCheckedIn,
        partial: partiallyCheckedIn,
        pending:
          totalBookings - fullyCheckedIn - partiallyCheckedIn,
      },
      upcomingBookings,
      recentBookings,
      todaysBookings,
      todayStats: {
        totalBookings: todaysBookings.length,
        totalPassengers: todayTotalPassengers,
        checkedIn: todayCheckedIn,
        pending: todayTotalPassengers - todayCheckedIn,
        revenue: todayRevenue,
        checkInRate:
          todayTotalPassengers > 0
            ? (todayCheckedIn / todayTotalPassengers) * 100
            : 0,
      },
    };
  }, [bookings]);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <Card className="w-full max-w-md border-border p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-foreground">
            Admin Console
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            Enter password to access admin settings
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleLogin()
                  }
                  className="border-border pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-destructive">{error}</p>
              )}
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Sign In
            </Button>

            <div className="pt-4 border-t border-border">
              <p className="text-center text-muted-foreground">
                Demo password:{" "}
                <code className="rounded bg-secondary px-2 py-1">
                  gosintra2025
                </code>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate("home")}
            >
              Back to Website
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="flex-1 bg-secondary/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-foreground">
                  Admin Console
                </h1>
              </div>
              <div className="h-1 w-20 rounded-full bg-accent" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadBookings}
                disabled={loadingBookings}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingBookings ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("home")}
                className="gap-2"
              >
                Back to Website
              </Button>

              <Button
                variant="outline"
                onClick={() => onNavigate("diagnostics")}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Diagnostics
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("qr-scanner")}
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR Scanner
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue="pickups"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="w-auto">
                <TabsTrigger
                  value="pickups"
                  className="flex items-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Pickups</span>
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                  {conversations.filter(
                    (c) => c.unreadByAdmin > 0,
                  ).length > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {
                        conversations.filter(
                          (c) => c.unreadByAdmin > 0,
                        ).length
                      }
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="metrics"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>More Options</SheetTitle>
                    <SheetDescription>
                      Access additional admin tools and settings
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("bookings");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Package className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Bookings</span>
                        <span className="text-xs text-muted-foreground">View and manage all bookings</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("drivers");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <UserCog className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Drivers</span>
                        <span className="text-xs text-muted-foreground">Manage driver accounts</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("pricing");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <DollarSign className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Pricing</span>
                        <span className="text-xs text-muted-foreground">Update pass and ticket prices</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("availability");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Users className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Availability</span>
                        <span className="text-xs text-muted-foreground">Manage seat capacity</span>
                      </div>
                    </Button>

                    <div className="my-4 h-px bg-border" />

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("images");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Image className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Images</span>
                        <span className="text-xs text-muted-foreground">Upload and manage images</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("content");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Settings className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Content</span>
                        <span className="text-xs text-muted-foreground">Edit website content</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("blog");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <FileText className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Blog</span>
                        <span className="text-xs text-muted-foreground">Create and edit articles</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("tags");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Tag className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Tags</span>
                        <span className="text-xs text-muted-foreground">Manage blog tags</span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("seo");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <TrendingUp className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>SEO Tools</span>
                        <span className="text-xs text-muted-foreground">Analyze and optimize SEO</span>
                      </div>
                    </Button>

                    <div className="my-4 h-px bg-border" />

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        onNavigate("analytics");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Advanced Analytics</span>
                        <span className="text-xs text-muted-foreground">Detailed performance reports</span>
                      </div>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* ====== PICKUP REQUESTS TAB ====== */}
          <TabsContent value="pickups" className="space-y-6">
            <PickupRequestsManagement />
          </TabsContent>

          {/* ====== METRICS TAB ====== */}
          <TabsContent value="metrics" className="space-y-6">
            {/* Today's Operations - Featured Section */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CalendarIconMetrics className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-foreground">
                      Today's Operations
                    </h2>
                    <p className="text-muted-foreground">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={loadBookings}
                  variant="outline"
                  size="sm"
                  disabled={loadingBookings}
                  className="gap-2"
                >
                  {loadingBookings ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {/* Today's Quick Stats */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <p className="text-muted-foreground">
                      Bookings
                    </p>
                  </div>
                  <p className="mt-2 text-foreground">
                    {metrics.todayStats.totalBookings}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <p className="text-muted-foreground">
                      Passengers
                    </p>
                  </div>
                  <p className="mt-2 text-foreground">
                    {metrics.todayStats.totalPassengers}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-muted-foreground">
                      Checked In
                    </p>
                  </div>
                  <p className="mt-2 text-foreground">
                    {metrics.todayStats.checkedIn} /{" "}
                    {metrics.todayStats.totalPassengers}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-green-600 transition-all duration-500"
                      style={{
                        width: `${metrics.todayStats.checkInRate}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <p className="text-muted-foreground">
                      Revenue
                    </p>
                  </div>
                  <p className="mt-2 text-primary">
                    €{metrics.todayStats.revenue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Today's Bookings List */}
              {metrics.todaysBookings.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-foreground">
                    Today's Bookings (
                    {metrics.todaysBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {metrics.todaysBookings.map(
                      (booking: any) => {
                        const totalPassengers =
                          booking.passengers?.length || 0;
                        const checkedInCount = (
                          booking.checkIns || []
                        ).filter(
                          (checkInArray: any[]) =>
                            checkInArray &&
                            checkInArray.length > 0,
                        ).length;
                        const bookingIdShort =
                          booking.id.split("_")[1] ||
                          booking.id;

                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <p className="font-mono text-primary">
                                  #{bookingIdShort}
                                </p>
                                <p className="text-muted-foreground">
                                  {booking.timeSlot}
                                </p>
                              </div>
                              <div className="h-8 w-px bg-border" />
                              <div>
                                <p className="text-foreground">
                                  {booking.contactInfo?.name ||
                                    "N/A"}
                                </p>
                                <p className="text-muted-foreground">
                                  {totalPassengers}{" "}
                                  {totalPassengers === 1
                                    ? "passenger"
                                    : "passengers"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-primary">
                                €
                                {booking.totalPrice?.toFixed(2)}
                              </p>
                              <div>
                                {checkedInCount === 0 ? (
                                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Pending
                                    </span>
                                  </div>
                                ) : checkedInCount ===
                                  totalPassengers ? (
                                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-green-600">
                                      Complete
                                    </span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                                    <span className="text-yellow-600">
                                      {checkedInCount}/
                                      {totalPassengers}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-border bg-white/50 p-8 text-center">
                  <CalendarIconMetrics className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-foreground">
                    No Bookings Today
                  </h3>
                  <p className="text-muted-foreground">
                    No bookings scheduled for today yet.
                  </p>
                </div>
              )}
            </Card>

            {/* Destination Tracker */}
            <DestinationTracker autoRefresh={true} />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Total Revenue
                    </p>
                    <h2 className="mt-2 text-foreground">
                      €{metrics.totalRevenue.toFixed(2)}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Total Bookings
                    </p>
                    <h2 className="mt-2 text-foreground">
                      {metrics.totalBookings}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Total Passengers
                    </p>
                    <h2 className="mt-2 text-foreground">
                      {metrics.totalPassengers}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Avg Booking Value
                    </p>
                    <h2 className="mt-2 text-foreground">
                      €{metrics.averageBookingValue.toFixed(2)}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Revenue Trend (Last 14 Days)
                  </h3>
                  <p className="text-muted-foreground">
                    Daily revenue overview
                  </p>
                </div>
                {metrics.revenueByDate.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <LineChart data={metrics.revenueByDate}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0e9e3"
                      />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #f0e9e3",
                        }}
                        formatter={(value: number) =>
                          `€${value.toFixed(2)}`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0A4D5C"
                        strokeWidth={2}
                        dot={{ fill: "#0A4D5C" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No revenue data yet
                    </p>
                  </div>
                )}
              </Card>

              {/* Ticket Type Distribution */}
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Ticket Type Distribution
                  </h3>
                  <p className="text-muted-foreground">
                    Standard vs Guided
                  </p>
                </div>
                {metrics.bookingsByTicketType.length > 0 &&
                metrics.totalBookings > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <RechartsPie>
                      <Pie
                        data={metrics.bookingsByTicketType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) =>
                          `${entry.type}: ${entry.count}`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {metrics.bookingsByTicketType.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CHART_COLORS[
                                  index % CHART_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(
                          value: number,
                          name: string,
                          props: any,
                        ) => [
                          `${value} bookings (${props.payload.percentage.toFixed(1)}%)`,
                          name,
                        ]}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No ticket data yet
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Popular Attractions & Check-in Stats */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Popular Attractions */}
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Popular Attractions
                  </h3>
                  <p className="text-muted-foreground">
                    Most booked add-ons
                  </p>
                </div>
                {metrics.popularAttractions.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <BarChart
                      data={metrics.popularAttractions}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0e9e3"
                      />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        stroke="#6b7280"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #f0e9e3",
                        }}
                      />
                      <Bar dataKey="count" fill="#D97843" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No attraction data yet
                    </p>
                  </div>
                )}
              </Card>

              {/* Check-in Status */}
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Check-in Overview
                  </h3>
                  <p className="text-muted-foreground">
                    Overall check-in rate:{" "}
                    {metrics.checkInRate.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-foreground">
                          Fully Checked In
                        </p>
                        <p className="text-muted-foreground">
                          All passengers checked in
                        </p>
                      </div>
                    </div>
                    <p className="text-green-600">
                      {metrics.checkInStats.checked}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="text-foreground">
                          Partially Checked In
                        </p>
                        <p className="text-muted-foreground">
                          Some passengers checked in
                        </p>
                      </div>
                    </div>
                    <p className="text-yellow-600">
                      {metrics.checkInStats.partial}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="text-foreground">
                          Not Checked In
                        </p>
                        <p className="text-muted-foreground">
                          Awaiting check-in
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {metrics.checkInStats.pending}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Monthly Revenue */}
            {metrics.revenueByMonth.length > 0 && (
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Monthly Revenue
                  </h3>
                  <p className="text-muted-foreground">
                    Revenue by month
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.revenueByMonth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0e9e3"
                    />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f0e9e3",
                      }}
                      formatter={(value: number) =>
                        `€${value.toFixed(2)}`
                      }
                    />
                    <Bar dataKey="revenue" fill="#0A4D5C" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Upcoming Bookings Preview */}
            {metrics.upcomingBookings.length > 0 && (
              <Card className="border-border p-6">
                <div className="mb-6">
                  <h3 className="text-foreground">
                    Upcoming Bookings
                  </h3>
                  <p className="text-muted-foreground">
                    Next 5 scheduled bookings
                  </p>
                </div>
                <div className="space-y-3">
                  {metrics.upcomingBookings.map(
                    (booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIconMetrics className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-foreground">
                              {new Date(
                                booking.selectedDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-muted-foreground">
                              {booking.contactInfo?.name ||
                                "N/A"}{" "}
                              ·{" "}
                              {booking.passengers?.length || 0}{" "}
                              passengers
                            </p>
                          </div>
                        </div>
                        <p className="text-primary">
                          €{booking.totalPrice?.toFixed(2)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ====== MESSAGES TAB ====== */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Conversations List */}
              <Card className="border-border p-6 lg:col-span-1">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="mb-2 text-foreground">
                      Conversations
                    </h2>
                    <div className="h-1 w-16 rounded-full bg-accent" />
                  </div>
                  <Button
                    onClick={loadConversations}
                    variant="outline"
                    size="sm"
                    disabled={loadingConversations}
                  >
                    {loadingConversations ? "..." : "Refresh"}
                  </Button>
                </div>

                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                    <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No conversations yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          loadConversationMessages(conv.id);
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedConversation === conv.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-white hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-foreground">
                              {conv.customerName}
                            </p>
                            <p className="text-muted-foreground">
                              {conv.customerEmail}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(
                                conv.lastMessageAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                          {conv.unreadByAdmin > 0 && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                              {conv.unreadByAdmin}
                            </span>
                          )}
                        </div>
                        {conv.status === "closed" && (
                          <div className="mt-2 inline-flex rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            Closed
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Chat Messages */}
              <Card className="border-border p-6 lg:col-span-2">
                {selectedConversation ? (
                  <>
                    <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <h2 className="text-foreground">
                          {
                            conversations.find(
                              (c) =>
                                c.id === selectedConversation,
                            )?.customerName
                          }
                        </h2>
                        <p className="text-muted-foreground">
                          {
                            conversations.find(
                              (c) =>
                                c.id === selectedConversation,
                            )?.customerEmail
                          }
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          closeConversation(
                            selectedConversation,
                          )
                        }
                        variant="outline"
                        size="sm"
                      >
                        Close Chat
                      </Button>
                    </div>

                    {/* Messages */}
                    <div
                      className="mb-6 space-y-4"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      {conversationMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${
                            msg.sender === "admin"
                              ? "flex-row-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                              msg.sender === "admin"
                                ? "bg-primary/10"
                                : "bg-accent/10"
                            }`}
                          >
                            <MessageCircle
                              className={`h-4 w-4 ${
                                msg.sender === "admin"
                                  ? "text-primary"
                                  : "text-accent"
                              }`}
                            />
                          </div>
                          <div
                            className={`flex-1 rounded-lg p-4 ${
                              msg.sender === "admin"
                                ? "bg-primary/5 text-foreground"
                                : "bg-secondary text-foreground"
                            }`}
                          >
                            <p className="break-words">
                              {msg.message}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {msg.senderName} ·{" "}
                              {new Date(
                                msg.timestamp,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    <div className="border-t border-border pt-4">
                      <div className="flex gap-2">
                        <Input
                          value={replyMessage}
                          onChange={(e) =>
                            setReplyMessage(e.target.value)
                          }
                          placeholder="Type your reply..."
                          className="flex-1 border-border"
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            sendAdminReply()
                          }
                        />
                        <Button
                          onClick={sendAdminReply}
                          disabled={!replyMessage.trim()}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[400px] items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                      <h3 className="mb-2 text-foreground">
                        Select a Conversation
                      </h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the left to
                        view and reply
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ====== BOOKINGS TAB ====== */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-border p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="mb-2 text-foreground">
                    All Bookings
                  </h2>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                  <p className="mt-4 text-muted-foreground">
                    View and manage all customer bookings with
                    check-in status
                  </p>
                </div>
                <Button
                  onClick={loadBookings}
                  variant="outline"
                  disabled={loadingBookings}
                >
                  {loadingBookings ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {loadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
                  <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-foreground">
                    No Bookings Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Bookings will appear here once customers
                    start booking day passes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(
                      (booking) =>
                        booking &&
                        booking.id &&
                        booking.selectedDate,
                    )
                    .map((booking) => {
                      const formattedDate = new Date(
                        booking.selectedDate,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      const bookingIdShort =
                        booking.id.split("_")[1] || booking.id;

                      // Calculate check-in status
                      const totalPassengers =
                        booking.passengers?.length || 0;
                      const checkedInCount = (
                        booking.checkIns || []
                      ).filter(
                        (checkInArray: any[]) =>
                          checkInArray &&
                          checkInArray.length > 0,
                      ).length;

                      return (
                        <Card
                          key={booking.id}
                          className="border-border p-6"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Booking Info */}
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-muted-foreground">
                                    Booking ID
                                  </p>
                                  <p className="font-mono text-primary">
                                    #{bookingIdShort}
                                  </p>
                                </div>
                                {/* Check-in Status Badge */}
                                <div>
                                  {checkedInCount === 0 ? (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        Not Checked In
                                      </span>
                                    </div>
                                  ) : checkedInCount ===
                                    totalPassengers ? (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                      <span className="text-green-600">
                                        All Checked In
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5">
                                      <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                                      <span className="text-yellow-600">
                                        Partially Checked In
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Customer
                                </p>
                                <p className="text-foreground">
                                  {booking.contactInfo?.name ||
                                    "N/A"}
                                </p>
                                <p className="text-muted-foreground">
                                  {booking.contactInfo?.email ||
                                    "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Date & Time
                                </p>
                                <p className="text-foreground">
                                  {formattedDate}
                                </p>
                                <p className="text-muted-foreground">
                                  {booking.timeSlot} - 8:00 PM
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Passengers
                                </p>
                                <p className="text-foreground">
                                  {totalPassengers}{" "}
                                  {totalPassengers === 1
                                    ? "passenger"
                                    : "passengers"}
                                </p>
                                {checkedInCount > 0 && (
                                  <p className="text-muted-foreground">
                                    {checkedInCount} checked in
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Total Price
                                </p>
                                <p className="text-primary">
                                  €
                                  {booking.totalPrice?.toFixed(
                                    2,
                                  ) || "0.00"}
                                </p>
                              </div>
                              {booking.guidedCommentary && (
                                <div className="rounded-lg bg-accent/10 px-3 py-2">
                                  <p className="text-accent">
                                    ✓ Guided Commentary
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* QR Codes Preview */}
                            <div>
                              <p className="mb-3 text-muted-foreground">
                                QR Codes
                              </p>
                              {!booking.qrCodes ||
                              booking.qrCodes.length === 0 ? (
                                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                                  <p className="text-muted-foreground">
                                    No QR codes available
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {booking.qrCodes
                                    .slice(0, 4)
                                    .map(
                                      (
                                        qrCode: string,
                                        index: number,
                                      ) => (
                                        <div
                                          key={index}
                                          className="rounded-lg border border-border bg-white p-2"
                                        >
                                          <img
                                            src={qrCode}
                                            alt={`QR Code ${index + 1}`}
                                            className="w-full"
                                          />
                                          <p className="mt-1 text-center text-muted-foreground">
                                            Pass {index + 1}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ====== DRIVERS TAB ====== */}
          <TabsContent value="drivers" className="space-y-6">
            <DriverManagement />
          </TabsContent>

          {/* ====== PRICING TAB ====== */}
          <TabsContent value="pricing" className="space-y-6">
            <Card className="border-border p-8">
              <div className="mb-6">
                <h2 className="mb-2 text-foreground">
                  Day Pass Pricing
                </h2>
                <div className="h-1 w-16 rounded-full bg-accent" />
              </div>

              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="basePrice">
                      Base Day Pass Price (€)
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      value={pricing.basePrice}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          basePrice:
                            parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-2 border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guidedSurcharge">
                      Guided Tour Surcharge (€)
                    </Label>
                    <Input
                      id="guidedSurcharge"
                      type="number"
                      min="0"
                      value={pricing.guidedTourSurcharge}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          guidedTourSurcharge:
                            parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-2 border-border"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-muted-foreground">
                    Preview: Day pass will cost{" "}
                    <strong className="text-foreground">
                      €{pricing.basePrice}
                    </strong>{" "}
                    per person. With guided commentary:{" "}
                    <strong className="text-foreground">
                      €
                      {pricing.basePrice +
                        pricing.guidedTourSurcharge}
                    </strong>
                  </p>
                </div>

                <Button
                  onClick={saveSettings}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Pricing
                </Button>
              </div>
            </Card>

            <Card className="border-border p-8">
              <div className="mb-6">
                <h2 className="mb-2 text-foreground">
                  Attraction Ticket Prices
                </h2>
                <div className="h-1 w-16 rounded-full bg-accent" />
              </div>

              <div className="space-y-4">
                {Object.entries(pricing.attractions).map(
                  ([id, attraction]) => (
                    <div
                      key={id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-white p-4"
                    >
                      <div className="flex-1">
                        <p className="text-foreground">
                          {attraction.name}
                        </p>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          value={attraction.price}
                          onChange={(e) =>
                            updateAttractionPrice(
                              id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="border-border"
                          placeholder="Price"
                        />
                      </div>
                      <span className="w-8 text-muted-foreground">
                        €
                      </span>
                    </div>
                  ),
                )}

                <Button
                  onClick={saveSettings}
                  className="mt-4 bg-primary hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Attraction Prices
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ====== AVAILABILITY TAB ====== */}
          <TabsContent
            value="availability"
            className="space-y-6"
          >
            <Card className="border-border p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="mb-2 text-foreground">
                    Seat Availability Management
                  </h2>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                  <p className="mt-4 text-muted-foreground">
                    Manage available seats for each departure
                    time. Default is 50 seats per time slot.
                  </p>
                  <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <p className="text-xs text-primary flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Availability automatically decrements when
                      customers book. Bookings are checked
                      against real-time availability.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={loadAvailability}
                  variant="outline"
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="availabilityDate"
                    className="text-foreground"
                  >
                    Select Date
                  </Label>
                  <Popover
                    open={calendarOpen}
                    onOpenChange={setCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full max-w-xs justify-start border-border text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? new Date(
                              selectedDate,
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          selectedDate
                            ? new Date(selectedDate)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(
                              date.toISOString().split("T")[0],
                            );
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(date) =>
                          date <
                          new Date(
                            new Date().setHours(0, 0, 0, 0),
                          )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="rounded-lg border border-border bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-foreground">
                      Time Slots for{" "}
                      {new Date(
                        selectedDate,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAllSlotsForDate(selectedDate, 50)
                        }
                      >
                        Set All to 50
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAllSlotsForDate(selectedDate, 0)
                        }
                      >
                        Set All to 0
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className="rounded-lg border border-border p-4"
                      >
                        <Label
                          htmlFor={`slot-${slot}`}
                          className="text-foreground"
                        >
                          {slot}
                        </Label>
                        <Input
                          id={`slot-${slot}`}
                          type="number"
                          min="0"
                          value={getAvailability(
                            selectedDate,
                            slot,
                          )}
                          onChange={(e) =>
                            updateAvailability(
                              selectedDate,
                              slot,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="mt-2 border-border"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={saveAvailability}
                  disabled={savingAvailability}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingAvailability
                    ? "Saving..."
                    : "Save Availability"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ====== IMAGES TAB ====== */}
          <TabsContent value="images" className="space-y-6">
            <ImageManager />
          </TabsContent>

          {/* ====== CONTENT TAB ====== */}
          <TabsContent value="content" className="space-y-6">
            <ContentEditor />
          </TabsContent>

          {/* ====== BLOG TAB ====== */}
          <TabsContent value="blog" className="space-y-6">
            <BlogEditor />
          </TabsContent>

          {/* ====== SEO TAB ====== */}
          <TabsContent value="seo" className="space-y-6">
            <SEOTools />
          </TabsContent>

          {/* ====== TAGS TAB ====== */}
          <TabsContent value="tags" className="space-y-6">
            <TagManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;