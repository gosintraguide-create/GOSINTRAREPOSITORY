import { useState, useEffect, useMemo } from "react";
import {
  Settings,
  Lock,
  LogIn,
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
  ArrowLeft,
  X,
  Trash2,
  Archive,
  ArchiveRestore,
  Car,
} from "lucide-react";
import { DestinationTracker } from "./DestinationTracker";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
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
import { createClient } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from "../lib/apiErrorHandler";
import { ContentEditor } from "./ContentEditor";
import { BlogEditor } from "./BlogEditor";
import { SEOTools } from "./SEOTools";
import { DriverManagement } from "./DriverManagementMobile";
import { PickupRequestsManagement } from "./PickupRequestsManagement";
import { TagManagement } from "./TagManagement";
import { ImageManager } from "./ImageManager";
import { CompactBookingsList } from "./CompactBookingsList";
import { FeatureFlagManager } from "./FeatureFlagManager";
import { DatabaseCleanup } from "./DatabaseCleanup";
import { BookingDiagnostics } from "./BookingDiagnostics";
import { SunsetSpecialManager } from "./SunsetSpecialManager";
import { BookingLogs } from "./BookingLogs";
import { PrivateTourManager } from "./PrivateTourManager";
import { TourRequestsManagement } from "./TourRequestsManagement";
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
  childPrice: number; // Ages 7-12
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
  childPrice: 15, // Ages 7-12
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
    "convento-capuchos": {
      name: "Convento dos Capuchos",
      price: 8,
    },
    "cabo-da-roca": {
      name: "Cabo da Roca",
      price: 0,
    },
    "villa-sassetti": {
      name: "Villa Sassetti",
      price: 0,
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
    const metaRobots = document.querySelector(
      'meta[name="robots"]',
    );
    if (metaRobots) {
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow";
      document.head.appendChild(meta);
    }
    document.title = "Admin Portal - Access Restricted";
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
  const [
    showArchivedConversations,
    setShowArchivedConversations,
  ] = useState(false);
  const [activeTab, setActiveTab] = useState("pickups");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [ticketPurchasesEnabled, setTicketPurchasesEnabled] =
    useState(true);

  // Notification state
  const [lastPickupCount, setLastPickupCount] = useState(0);
  const [lastBookingCount, setLastBookingCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [newPickupsCount, setNewPickupsCount] = useState(0);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [pickupRequests, setPickupRequests] = useState<any[]>(
    [],
  );
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showMobileGuide, setShowMobileGuide] = useState(() => {
    return localStorage.getItem('hide-mobile-guide') !== 'true';
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Detect mobile device type
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
  }, []);

  // Mobile notification helper function
  const sendMobileNotification = (type: 'booking' | 'message' | 'pickup', details: {
    title: string;
    body: string;
    id?: string;
  }) => {
    console.log(`📱 Sending mobile notification: ${type}`, details);

    // Update page title with unread count
    const newTotal = newPickupsCount + newBookingsCount + (conversations.filter(c => c.unreadByAdmin > 0 && !c.archived).length);
    setTotalUnreadCount(newTotal + 1);
    document.title = newTotal > 0 ? `(${newTotal + 1}) Hop On Sintra Admin` : 'Hop On Sintra Admin';

    // 1. Play notification sound (works on all mobile browsers)
    if (notificationSound) {
      notificationSound.play().catch(e => console.log('Could not play sound:', e));
    }

    // 2. Vibrate device (works on Android and some iOS)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms, pause 100ms, 200ms
    }

    // 3. Show persistent toast notification (longer duration for mobile)
    const emoji = type === 'booking' ? '🎫' : type === 'message' ? '💬' : '🚗';
    toast.success(`${emoji} ${details.title}`, {
      duration: 10000, // 10 seconds for mobile
      description: details.body,
    });

    // 4. Try desktop notification (works on Android Chrome, not iOS)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(details.title, {
          body: details.body,
          icon: '/favicon.ico',
          tag: `${type}-notification`,
          requireInteraction: true, // Keeps notification visible until dismissed
        });
      } catch (e) {
        console.log('Desktop notification not supported:', e);
      }
    }
  };

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
          if (data.success && data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...(data.pricing.attractions || {}),
              },
            });
            localStorage.setItem(
              "admin-pricing",
              JSON.stringify(data.pricing),
            );
            console.log("✅ Loaded pricing from database");
          } else {
            console.log("ℹ️ Using default pricing");
            setPricing(DEFAULT_PRICING);
          }
        } else if (response.status === 404) {
          // Backend not deployed - use cached or default pricing silently
          console.log("ℹ️ Backend not available, using cached/default pricing");
          setPricing(DEFAULT_PRICING);
          
          const cached = localStorage.getItem("admin-pricing");
          if (cached) {
            try {
              const cachedPricing = JSON.parse(cached);
              setPricing({
                ...DEFAULT_PRICING,
                ...cachedPricing,
                attractions: {
                  ...DEFAULT_PRICING.attractions,
                  ...(cachedPricing.attractions || {}),
                },
              });
              console.log("✅ Using cached pricing from localStorage");
            } catch (e) {
              console.error("Error parsing cached pricing:", e);
            }
          }
        } else {
          console.warn(`Backend returned ${response.status}, using defaults`);
          setPricing(DEFAULT_PRICING);
          
          const cached = localStorage.getItem("admin-pricing");
          if (cached) {
            try {
              const cachedPricing = JSON.parse(cached);
              setPricing({
                ...DEFAULT_PRICING,
                ...cachedPricing,
                attractions: {
                  ...DEFAULT_PRICING.attractions,
                  ...(cachedPricing.attractions || {}),
                },
              });
              console.log("✅ Using cached pricing from localStorage");
            } catch (e) {
              console.error("Error parsing cached pricing:", e);
            }
          }
        }
      } catch (error) {
        console.log("ℹ️ Backend connection failed, using cached/default pricing");
        setPricing(DEFAULT_PRICING);
        
        const cached = localStorage.getItem("admin-pricing");
        if (cached) {
          try {
            const cachedPricing = JSON.parse(cached);
            setPricing({
              ...DEFAULT_PRICING,
              ...cachedPricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...(cachedPricing.attractions || {}),
              },
            });
            console.log("✅ Using cached pricing from localStorage");
          } catch (e) {
            console.error("Error parsing cached pricing:", e);
          }
        }
      }
    }
    loadPricingFromDB();

    // Load ticket purchases enabled setting
    async function loadTicketPurchasesSetting() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/settings/ticket-purchases-enabled`,
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
          setTicketPurchasesEnabled(data.enabled !== false); // Default to true if not set
          console.log(
            "✅ Loaded ticket purchases setting:",
            data.enabled,
          );
        }
      } catch (error) {
        console.error(
          "Error loading ticket purchases setting:",
          error,
        );
        // Default to true on error for safety
        setTicketPurchasesEnabled(true);
      }
    }
    loadTicketPurchasesSetting();
  }, []);

  // Initialize notification sound for mobile
  useEffect(() => {
    // Create notification sound (simple tone using Web Audio API)
    const createNotificationSound = () => {
      try {
        // Create a simple audio object with a play function that uses Web Audio API
        const dummyAudio = {
          play: () => {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.2);
            } catch (e) {
              console.log('Could not play beep:', e);
            }
          }
        };
        
        setNotificationSound(dummyAudio as any);
        console.log('📱 Notification sound initialized for mobile');
      } catch (e) {
        console.log('Could not initialize notification sound:', e);
      }
    };

    createNotificationSound();
  }, []);

  // Keep screen awake on mobile (helps maintain real-time connection)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let wakeLock: any = null;
    
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('📱 Screen wake lock activated - notifications will work while screen is on');
          
          wakeLock.addEventListener('release', () => {
            console.log('📱 Screen wake lock released');
          });
        }
      } catch (err) {
        console.log('Wake lock not supported or failed:', err);
      }
    };
    
    requestWakeLock();
    
    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isAuthenticated]);

  // Fetch bookings from server
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchBookings() {
      setLoadingBookings(true);
      try {
        console.log("🔄 Fetching bookings from server...");
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        console.log("📡 Response status:", response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Bookings fetched successfully:", data.bookings?.length || 0);
          setBookings(data.bookings || []);
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("❌ Server error:", errorData);
          toast.error(`Failed to fetch bookings: ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        toast.error(`Network error: ${error instanceof Error ? error.message : "Failed to fetch bookings"}`);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchBookings();

    // Set up realtime subscription for instant booking updates
    const supabase = createClient();
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kv_store_3bd0ade8",
        },
        async (payload) => {
          // Filter out non-booking keys (pickup requests, chat, etc.)
          const key = payload.new?.key;
          if (
            !key ||
            key.startsWith("PICKUP_") ||
            key.startsWith("pickup_") ||
            key.startsWith("chat_") ||
            key.startsWith("availability_") ||
            key.startsWith("checkin_")
          ) {
            return; // Ignore non-booking changes
          }
          
          // Only process keys that look like bookings (contain a dash, e.g., AA-1234)
          if (!key.includes("-")) {
            return;
          }
          console.log(
            "🔔 Realtime booking change detected:",
            payload,
          );

          // Check if this is a new booking (INSERT event)
          if (payload.eventType === "INSERT" && payload.new) {
            const today = new Date()
              .toISOString()
              .split("T")[0];
            const newBooking = payload.new.value;

            // Check if booking was created today
            if (newBooking?.createdAt) {
              const createdDate = new Date(newBooking.createdAt)
                .toISOString()
                .split("T")[0];

              if (createdDate === today) {
                // Increment badge counter
                setNewBookingsCount((prev) => prev + 1);

                // Send mobile-friendly notification
                sendMobileNotification('booking', {
                  title: 'New Booking Received!',
                  body: `Booking ${newBooking.id} from ${newBooking.passengers?.[0]?.firstName || "customer"}`,
                  id: newBooking.id
                });
              }
            }
          }

          // Reload bookings when any booking changes
          await fetchBookings();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Bookings subscription active');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from bookings channel');
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Set up realtime subscription for instant message notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const supabase = createClient();
    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kv_store_3bd0ade8",
        },
        async (payload) => {
          // Filter for chat-related keys only
          const key = payload.new?.key;
          if (!key || !key.startsWith("chat_")) {
            return;
          }
          console.log(
            "🔔 Realtime message change detected:",
            payload,
          );

          // Check if this is a new message or conversation update
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const key = payload.new?.key;

            // If it's a conversation update, check for new unread messages
            if (key?.startsWith("chat_conversation_")) {
              const conversation = payload.new?.value;

              if (conversation?.unreadByAdmin > 0) {
                // Send mobile-friendly notification
                sendMobileNotification('message', {
                  title: 'New Message Received!',
                  body: `Message from ${conversation.customerName || "customer"}`,
                  id: conversation.id
                });
              }
            }
          }

          // Reload conversations when any message-related change happens
          await loadConversations();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Messages subscription active');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from messages channel');
      supabase.removeChannel(messagesChannel);
    };
  }, [isAuthenticated]);

  // Set up realtime subscription for instant pickup request notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const supabase = createClient();
    const pickupsChannel = supabase
      .channel("pickups-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kv_store_3bd0ade8",
        },
        async (payload) => {
          // Filter for pickup request keys only
          const key = payload.new?.key;
          if (!key || !key.startsWith("pickup_request:")) {
            return;
          }
          console.log(
            "🔔 Realtime pickup request change detected:",
            payload,
          );

          // Check if this is a new pickup request (INSERT event)
          if (payload.eventType === "INSERT" && payload.new) {
            const newPickup = payload.new.value;

            // Check if this is a pending pickup request
            if (newPickup?.status === "pending") {
              console.log("✅ New pending pickup request detected:", newPickup);
              
              // Increment badge counter
              setNewPickupsCount((prev) => prev + 1);

              // Send mobile-friendly notification
              sendMobileNotification('pickup', {
                title: 'New Pickup Request!',
                body: `${newPickup.groupSize} passengers at ${newPickup.pickupLocation}`,
                id: newPickup.id
              });

              // Show toast notification
              toast.success(
                `🚗 New pickup request: ${newPickup.groupSize} passengers at ${newPickup.pickupLocation}`,
                { duration: 5000 }
              );
            }
          }

          // Reload pickup requests from the PickupRequestsManagement component
          // It will handle its own data refresh
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Pickup requests subscription active');
        }
        // Silently handle errors - polling will handle updates
      });

    // Note: PickupRequestsManagement component handles its own realtime + polling fallback

    return () => {
      console.log('🔌 Unsubscribing from pickup requests channel');
      supabase.removeChannel(pickupsChannel);
    };
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
    if (password === "Sintra2025") {
      setIsAuthenticated(true);
      localStorage.setItem("admin-session", "authenticated");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem(
        "admin-pricing",
        JSON.stringify(pricing),
      );

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

  const toggleTicketPurchases = async (enabled: boolean) => {
    setTicketPurchasesEnabled(enabled);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/settings/ticket-purchases-enabled`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save setting to database");
      }

      toast.success(
        enabled
          ? "✅ Ticket purchases enabled - Customers can now book!"
          : "🔒 Ticket purchases disabled - All dates show as sold out",
      );
    } catch (error) {
      console.error(
        "Error saving ticket purchases setting:",
        error,
      );
      toast.error("Failed to save setting");
      // Revert on error
      setTicketPurchasesEnabled(!enabled);
    }
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      localStorage.setItem(
        "admin-availability",
        JSON.stringify(availability),
      );

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
    return availability[date]?.[timeSlot] ?? 50;
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
      const validBookings = result.bookings.filter(
        (booking: any) =>
          booking && booking.id && booking.selectedDate,
      );

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
      console.log(
        `✅ Loaded ${bookingsWithCheckIns.length} bookings with check-in data`,
      );
    } else {
      setBookings([]);
      console.log("ℹ️ No bookings found");
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

  const loadPickupRequests = async () => {
    try {
      const result = await safeJsonFetch<any>(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (result?.success && result.requests) {
        setPickupRequests(result.requests);
        return result.requests;
      } else {
        setPickupRequests([]);
        return [];
      }
    } catch (error) {
      console.error("Error loading pickup requests:", error);
      setPickupRequests([]);
      return [];
    }
  };

  const checkForNewItems = async (showNotifications = true) => {
    // Load fresh data
    const [pickups, bookingsResult, conversationsResult] =
      await Promise.all([
        loadPickupRequests(),
        safeJsonFetch<any>(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        ),
        safeJsonFetch<any>(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/conversations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        ),
      ]);

    // Count pending pickups (status !== 'completed' and status !== 'cancelled')
    const pendingPickups = pickups.filter(
      (p: any) =>
        p.status !== "completed" && p.status !== "cancelled",
    );
    const currentPickupCount = pendingPickups.length;

    // Count today's bookings
    const today = new Date().toISOString().split("T")[0];
    // Count bookings CREATED today (not scheduled for today)
    const todaysBookings =
      bookingsResult?.bookings?.filter((b: any) => {
        if (!b.createdAt) return false;
        const createdDate = new Date(b.createdAt)
          .toISOString()
          .split("T")[0];
        return createdDate === today;
      }) || [];
    const currentBookingCount = todaysBookings.length;

    // Count unread messages
    const unreadMessages =
      conversationsResult?.conversations?.filter(
        (c: any) => c.unreadByAdmin > 0 && !c.archived,
      ) || [];
    const currentMessageCount = unreadMessages.length;

    if (showNotifications) {
      // Check for new pickups
      if (
        currentPickupCount > lastPickupCount &&
        lastPickupCount > 0
      ) {
        const newCount = currentPickupCount - lastPickupCount;
        toast.info(
          `🚗 ${newCount} new pickup request${newCount > 1 ? "s" : ""}!`,
          {
            duration: 5000,
          },
        );
        setNewPickupsCount((prev) => prev + newCount);

        // Browser notification
        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("New Pickup Request", {
            body: `${newCount} new pickup request${newCount > 1 ? "s" : ""} received`,
            icon: "/favicon.ico",
            tag: "pickup-notification",
          });
        }
      }

      // Check for new bookings
      if (
        currentBookingCount > lastBookingCount &&
        lastBookingCount > 0
      ) {
        const newCount = currentBookingCount - lastBookingCount;
        toast.success(
          `🎫 ${newCount} new booking${newCount > 1 ? "s" : ""} today!`,
          {
            duration: 5000,
          },
        );
        setNewBookingsCount((prev) => prev + newCount);

        // Browser notification
        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("New Booking", {
            body: `${newCount} new booking${newCount > 1 ? "s" : ""} received today`,
            icon: "/favicon.ico",
            tag: "booking-notification",
          });
        }
      }

      // Check for new messages
      if (
        currentMessageCount > lastMessageCount &&
        lastMessageCount > 0
      ) {
        const newCount = currentMessageCount - lastMessageCount;
        toast.info(
          `💬 ${newCount} new message${newCount > 1 ? "s" : ""}!`,
          {
            duration: 5000,
          },
        );

        // Browser notification
        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("New Message", {
            body: `${newCount} new message${newCount > 1 ? "s" : ""} from customers`,
            icon: "/favicon.ico",
            tag: "message-notification",
          });
        }
      }
    }

    // Update counts
    setLastPickupCount(currentPickupCount);
    setLastBookingCount(currentBookingCount);
    setLastMessageCount(currentMessageCount);

    // Update main data
    if (bookingsResult?.success && bookingsResult.bookings) {
      const validBookings = bookingsResult.bookings.filter(
        (booking: any) =>
          booking && booking.id && booking.selectedDate,
      );
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
    }

    if (
      conversationsResult?.success &&
      conversationsResult.conversations
    ) {
      setConversations(conversationsResult.conversations);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Request notification permission
      if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            toast.success("Browser notifications enabled!");
          }
        });
      }

      // Initial load without notifications
      checkForNewItems(false);
    }
  }, [isAuthenticated]);

  // Auto-refresh every 30 seconds
  // Removed polling interval - realtime subscriptions handle all updates automatically

  // Update page title when notification counts change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unreadMessages = conversations.filter(c => c.unreadByAdmin > 0 && !c.archived).length;
    const totalCount = newPickupsCount + newBookingsCount + unreadMessages;
    
    if (totalCount > 0) {
      document.title = `(${totalCount}) Hop On Sintra Admin`;
    } else {
      document.title = 'Hop On Sintra Admin';
    }
  }, [isAuthenticated, newPickupsCount, newBookingsCount, conversations]);

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
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success && result.messages) {
      setConversationMessages(result.messages);
    }

    // Mark conversation as read
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

    // Update local conversation state to clear unread badge
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadByAdmin: 0 }
          : conv
      )
    );
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    const result = await safeJsonFetch<any>(
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
          senderName: "Hop On Sintra Team",
          message: replyMessage,
        }),
      },
    );

    if (result?.success) {
      setReplyMessage("");
      loadConversationMessages(selectedConversation);
      loadConversations();
    }
  };

  const handleCloseConversation = async (
    conversationId: string,
  ) => {
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/close`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success) {
      loadConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    }
  };

  const handleArchiveConversation = async (
    conversationId: string,
  ) => {
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/archive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success) {
      toast.success("Conversation archived");
      loadConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    }
  };

  const handleUnarchiveConversation = async (
    conversationId: string,
  ) => {
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${conversationId}/unarchive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (result?.success) {
      toast.success("Conversation restored");
      loadConversations();
    }
  };

  useEffect(() => {
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
          if (data.success && data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              attractions: {
                ...DEFAULT_PRICING.attractions,
                ...(data.pricing.attractions || {}),
              },
            });
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

      // Fallback to defaults
      setPricing(DEFAULT_PRICING);
      
      const savedPricing =
        localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          const cachedPricing = JSON.parse(savedPricing);
          setPricing({
            ...DEFAULT_PRICING,
            ...cachedPricing,
            attractions: {
              ...DEFAULT_PRICING.attractions,
              ...(cachedPricing.attractions || {}),
            },
          });
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

  // Load bookings when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
      loadConversations();
    }
  }, [isAuthenticated]);

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

    // Today's stats
    const today = new Date().toISOString().split("T")[0];
    const todaysBookings = bookings.filter(
      (b) => b.selectedDate === today,
    );
    let todayCheckedIn = 0;
    let todayTotalPassengers = 0;
    let todayRevenue = 0;

    todaysBookings.forEach((booking) => {
      const total = booking.passengers?.length || 0;
      const checked = (booking.checkIns || []).filter(
        (checkInArray: any[]) =>
          checkInArray && checkInArray.length > 0,
      ).length;
      todayCheckedIn += checked;
      todayTotalPassengers += total;
      todayRevenue += booking.totalPrice || 0;
    });

    // Revenue by date (last 30 days)
    const last30Days: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayRevenue = bookings
        .filter((b) => b.selectedDate === dateStr)
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      last30Days.push({ date: dateStr, revenue: dayRevenue });
    }

    // Revenue by month (last 12 months)
    const revenueByMonth: {
      month: string;
      revenue: number;
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthRevenue = bookings
        .filter((b) => b.selectedDate?.startsWith(monthStr))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      revenueByMonth.push({
        month: monthStr,
        revenue: monthRevenue,
      });
    }

    // Bookings by ticket type
    const standardCount = bookings.filter(
      (b) => !b.isGuidedTour,
    ).length;
    const guidedCount = bookings.filter(
      (b) => b.isGuidedTour,
    ).length;
    const bookingsByTicketType = [
      { type: "Standard", count: standardCount },
      { type: "Guided", count: guidedCount },
    ];

    // Popular attractions
    const attractionCounts: { [key: string]: number } = {};
    bookings.forEach((booking) => {
      (booking.attractions || []).forEach((attr: string) => {
        attractionCounts[attr] =
          (attractionCounts[attr] || 0) + 1;
      });
    });
    const popularAttractions = Object.entries(attractionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Upcoming bookings (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);
    const upcomingStr = upcomingDate
      .toISOString()
      .split("T")[0];
    const upcomingBookings = bookings
      .filter(
        (b) =>
          b.selectedDate >= today &&
          b.selectedDate <= upcomingStr,
      )
      .sort(
        (a, b) =>
          new Date(a.selectedDate).getTime() -
          new Date(b.selectedDate).getTime(),
      )
      .slice(0, 5);

    // Recent bookings
    const recentBookings = [...bookings]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5);

    return {
      totalRevenue,
      totalBookings,
      totalPassengers,
      averageBookingValue,
      checkInRate,
      revenueByDate: last30Days,
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
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="flex-1 bg-secondary/30 py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h1 className="text-foreground text-lg sm:text-xl lg:text-2xl">
                  Admin Console
                </h1>
              </div>
              <div className="h-1 w-16 sm:w-20 rounded-full bg-accent" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setLoadingBookings(true);
                  checkForNewItems(false).finally(() =>
                    setLoadingBookings(false),
                  );
                }}
                disabled={loadingBookings}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loadingBookings ? "animate-spin" : ""}`}
                />
                <span className="hidden md:inline">
                  Refresh Data
                </span>
                <span className="md:hidden">Refresh</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("home")}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <span className="hidden sm:inline">
                  Back to Website
                </span>
                <span className="sm:hidden">Website</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => onNavigate("diagnostics")}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                size="sm"
              >
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">
                  Diagnostics
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("qr-scanner")}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                size="sm"
              >
                <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">
                  QR Scanner
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Setup Guide Banner */}
        {showMobileGuide && (isIOS || isAndroid || window.innerWidth < 768) && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-teal-500/10 to-orange-500/10 border border-teal-500/50 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 text-2xl">📱</div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">
                  {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile'} Notifications Active!
                </h3>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <p>✅ Real-time push notifications enabled</p>
                  <p>✅ Sound alerts for new bookings, messages & pickups</p>
                  {isAndroid && <p>✅ Vibration enabled</p>}
                  {isIOS && (
                    <p className="text-amber-600 dark:text-amber-400">
                      ⚠️ iOS: Keep this tab active for notifications
                    </p>
                  )}
                  <p className="mt-2 text-xs opacity-75">
                    💡 <strong>Tip:</strong> {isIOS ? 'Add to home screen for best experience' : 'Keep this tab open in background'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMobileGuide(false);
                  localStorage.setItem('hide-mobile-guide', 'true');
                }}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <Tabs
          defaultValue="pickups"
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            // Clear notification badges when tab is clicked
            if (tab === "pickups") {
              setNewPickupsCount(0);
            } else if (tab === "bookings") {
              setNewBookingsCount(0);
            }
            // Update page title to reflect cleared count
            const unreadMessages = conversations.filter(c => c.unreadByAdmin > 0 && !c.archived).length;
            const totalCount = newPickupsCount + newBookingsCount + unreadMessages;
            const clearedTotal = tab === "pickups" ? totalCount - newPickupsCount : tab === "bookings" ? totalCount - newBookingsCount : totalCount;
            document.title = clearedTotal > 0 ? `(${clearedTotal}) Hop On Sintra Admin` : 'Hop On Sintra Admin';
          }}
          className="w-full"
        >
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1">
                <TabsTrigger
                  value="pickups"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 relative"
                >
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Pickups</span>
                  {newPickupsCount > 0 && (
                    <span className="ml-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white animate-pulse">
                      {newPickupsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 relative"
                >
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Bookings</span>
                  {newBookingsCount > 0 && (
                    <span className="ml-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white animate-pulse">
                      {newBookingsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 relative"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Messages</span>
                  {conversations.filter(
                    (c) => c.unreadByAdmin > 0 && !c.archived,
                  ).length > 0 && (
                    <span className="ml-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              <Sheet
                open={moreMenuOpen}
                onOpenChange={setMoreMenuOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 text-xs sm:text-sm px-3 sm:px-4"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    More
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md overflow-y-auto"
                >
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
                        setActiveTab("drivers");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <UserCog className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Drivers</span>
                        <span className="text-xs text-muted-foreground">
                          Manage driver accounts
                        </span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("settings");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <DollarSign className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Settings</span>
                        <span className="text-xs text-muted-foreground">
                          Pricing, availability & system
                          settings
                        </span>
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
                        <span className="text-xs text-muted-foreground">
                          Upload and manage images
                        </span>
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
                        <span className="text-xs text-muted-foreground">
                          Edit website content
                        </span>
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
                        <span className="text-xs text-muted-foreground">
                          Manage blog articles
                        </span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("private-tours");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Car className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Private Tours</span>
                        <span className="text-xs text-muted-foreground">
                          Manage tour packages
                        </span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("tour-requests");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Tour Requests</span>
                        <span className="text-xs text-muted-foreground">
                          Manage booking inquiries
                        </span>
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
                      <Tag className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>SEO</span>
                        <span className="text-xs text-muted-foreground">
                          SEO tools and settings
                        </span>
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
                        <span className="text-xs text-muted-foreground">
                          Manage blog tags
                        </span>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("logs");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <FileText className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Booking Logs</span>
                        <span className="text-xs text-muted-foreground">
                          View booking history & trip records
                        </span>
                      </div>
                    </Button>

                    <div className="my-4 h-px bg-border" />

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        setActiveTab("cleanup");
                        setMoreMenuOpen(false);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span>Database Cleanup</span>
                        <span className="text-xs text-muted-foreground">
                          Remove old data and optimize
                        </span>
                      </div>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* ====== PICKUPS TAB ====== */}
          <TabsContent
            value="pickups"
            className="space-y-4 sm:space-y-6"
          >
            <PickupRequestsManagement />
          </TabsContent>

          {/* ====== BOOKINGS TAB ====== */}
          <TabsContent
            value="bookings"
            className="space-y-4 sm:space-y-6"
          >
            <CompactBookingsList
              bookings={bookings}
              onRefresh={loadBookings}
            />
          </TabsContent>

          {/* ====== MESSAGES TAB ====== */}
          <TabsContent
            value="messages"
            className="space-y-4 sm:space-y-6"
          >
            {/* WhatsApp-style layout */}
            <div className="flex h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] overflow-hidden rounded-lg border border-border bg-background">
              {/* Left Sidebar - Conversations List */}
              <div
                className={`flex w-full flex-col border-r border-border md:w-[350px] ${selectedConversation ? "hidden md:flex" : "flex"}`}
              >
                {/* Sidebar Header */}
                <div className="border-b border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-foreground">
                      Messages
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowArchivedConversations(
                          !showArchivedConversations,
                        )
                      }
                      className="gap-2"
                    >
                      {showArchivedConversations ? (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden md:inline">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4" />
                          <span className="hidden md:inline">
                            Archived
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {showArchivedConversations
                      ? `${conversations.filter((c: any) => c.archived).length} archived`
                      : `${conversations.filter((c: any) => c.unreadByAdmin > 0 && !c.archived).length} unread`}
                  </p>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : conversations.filter((c: any) =>
                      showArchivedConversations
                        ? c.archived
                        : !c.archived,
                    ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-center text-muted-foreground">
                        {showArchivedConversations
                          ? "No archived conversations"
                          : "No conversations yet"}
                      </p>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {showArchivedConversations
                          ? "Archived chats will appear here"
                          : "Customer messages will appear here"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {conversations
                        .filter((c: any) =>
                          showArchivedConversations
                            ? c.archived
                            : !c.archived,
                        )
                        .map((conv: any) => {
                          const lastMessage =
                            conv.lastMessage || "";
                          const lastMessageTime =
                            conv.lastMessageTime
                              ? new Date(conv.lastMessageTime)
                              : new Date(conv.createdAt);
                          const isToday =
                            new Date().toDateString() ===
                            lastMessageTime.toDateString();
                          const timeDisplay = isToday
                            ? lastMessageTime.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : lastMessageTime.toLocaleDateString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              );

                          return (
                            <button
                              key={conv.id}
                              onClick={() => {
                                setSelectedConversation(
                                  conv.id,
                                );
                                loadConversationMessages(
                                  conv.id,
                                );
                              }}
                              className={`w-full border-b border-border p-4 text-left transition-colors hover:bg-secondary/30 ${
                                selectedConversation === conv.id
                                  ? "bg-primary/5 border-l-4 border-l-primary"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <span className="font-semibold">
                                    {(conv.name || "A")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`truncate ${conv.unreadByAdmin > 0 ? "font-semibold" : ""} text-foreground`}
                                    >
                                      {conv.name || "Anonymous"}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {timeDisplay}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1">
                                    <p
                                      className={`truncate text-sm ${conv.unreadByAdmin > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                                    >
                                      {lastMessage ||
                                        "No messages yet"}
                                    </p>
                                    {conv.unreadByAdmin > 0 && (
                                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {conv.unreadByAdmin}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Chat Area */}
              <div
                className={`flex flex-1 flex-col ${selectedConversation ? "flex" : "hidden md:flex"}`}
              >
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-border bg-background p-4">
                      <div className="flex items-center gap-3">
                        {/* Back Button (Mobile) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedConversation(null)
                          }
                          className="md:hidden p-2"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        {/* Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="font-semibold">
                            {(
                              conversations.find(
                                (c: any) =>
                                  c.id === selectedConversation,
                              )?.name || "A"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 overflow-hidden">
                          <p className="font-medium text-foreground truncate">
                            {conversations.find(
                              (c: any) =>
                                c.id === selectedConversation,
                            )?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversations.find(
                              (c: any) =>
                                c.id === selectedConversation,
                            )?.email || ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversations.find(
                          (c: any) =>
                            c.id === selectedConversation,
                        )?.archived ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUnarchiveConversation(
                                selectedConversation,
                              )
                            }
                            className="gap-2"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                            <span className="hidden md:inline">
                              Restore
                            </span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleArchiveConversation(
                                selectedConversation,
                              )
                            }
                            className="gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            <span className="hidden md:inline">
                              Archive
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadConversations}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto bg-secondary/5 p-4 space-y-3">
                      {conversationMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">
                            No messages yet
                          </p>
                        </div>
                      ) : (
                        conversationMessages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender === "admin"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                msg.sender === "admin"
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-background border border-border text-foreground rounded-bl-sm"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">
                                {msg.message}
                              </p>
                              <p
                                className={`mt-1 text-xs ${
                                  msg.sender === "admin"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                } text-right`}
                              >
                                {new Date(
                                  msg.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-border bg-background p-4">
                      <div className="flex gap-2">
                        <Input
                          value={replyMessage}
                          onChange={(e) =>
                            setReplyMessage(e.target.value)
                          }
                          placeholder="Type a message..."
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleSendReply()
                          }
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim()}
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="hidden md:flex h-full flex-col items-center justify-center bg-secondary/5 p-8">
                    <MessageCircle className="h-20 w-20 text-muted-foreground/30 mb-4" />
                    <h3 className="font-medium text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-center text-sm text-muted-foreground max-w-sm">
                      Choose a conversation from the list to
                      view and respond to customer messages
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ====== METRICS TAB ====== */}
          <TabsContent
            value="metrics"
            className="space-y-4 sm:space-y-6"
          >
            {/* Today's Operations - Featured Section */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10">
                    <CalendarIconMetrics className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-foreground text-sm sm:text-base">
                      Today's Operations
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">
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
                  onClick={() => {
                    setLoadingBookings(true);
                    checkForNewItems(false).finally(() =>
                      setLoadingBookings(false),
                    );
                  }}
                  variant="outline"
                  size="sm"
                  disabled={loadingBookings}
                  className="gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                >
                  {loadingBookings ? (
                    <>
                      <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="hidden sm:inline">
                        Updating...
                      </span>
                      <span className="sm:hidden">
                        Loading...
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {/* Today's Quick Stats */}
              <div className="mb-4 sm:mb-6 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Bookings
                    </p>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-foreground text-lg sm:text-2xl">
                    {metrics.todayStats.totalBookings}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Passengers
                    </p>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-foreground text-lg sm:text-2xl">
                    {metrics.todayStats.totalPassengers}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Checked In
                    </p>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-foreground text-sm sm:text-base">
                    {metrics.todayStats.checkedIn} /{" "}
                    {metrics.todayStats.totalPassengers}
                  </p>
                  <div className="mt-1.5 sm:mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-green-600 transition-all duration-500"
                      style={{
                        width: `${metrics.todayStats.checkInRate}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Revenue
                    </p>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-primary text-lg sm:text-2xl">
                    €{metrics.todayStats.revenue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Today's Bookings List */}
              {metrics.todaysBookings.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-foreground text-sm sm:text-base">
                    Today's Bookings (
                    {metrics.todaysBookings.length})
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
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
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 sm:p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="flex flex-col">
                                <p className="font-mono text-primary text-xs sm:text-sm">
                                  #{bookingIdShort}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {booking.timeSlot}
                                </p>
                              </div>
                              <div className="h-8 w-px bg-border hidden sm:block" />
                              <div>
                                <p className="text-foreground text-sm sm:text-base">
                                  {booking.contactInfo?.name ||
                                    "N/A"}
                                </p>
                                <p className="text-muted-foreground text-xs sm:text-sm">
                                  {totalPassengers}{" "}
                                  {totalPassengers === 1
                                    ? "passenger"
                                    : "passengers"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                              <p className="text-primary text-sm sm:text-base">
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
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card className="border-border p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-foreground text-sm sm:text-base">
                    Revenue Trend (Last 14 Days)
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Daily revenue overview
                  </p>
                </div>
                {metrics.revenueByDate.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={250}
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
                          `€${(value || 0).toFixed(2)}`
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
              <Card className="border-border p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-foreground text-sm sm:text-base">
                    Ticket Type Distribution
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Standard vs Guided
                  </p>
                </div>
                {metrics.bookingsByTicketType.length > 0 &&
                metrics.totalBookings > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={250}
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
                          `${value} bookings (${props.payload?.percentage?.toFixed(1) || "0.0"}%)`,
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
                        `€${(value || 0).toFixed(2)}`
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

          {/* ====== SETTINGS TAB ====== */}
          <TabsContent
            value="settings"
            className="space-y-4 sm:space-y-6"
          >
            {/* Feature Flags */}
            <FeatureFlagManager />

            {/* Sunset Special Manager */}
            <SunsetSpecialManager />

            {/* Pricing & Availability - moved from old location */}
            <Card className="border-border p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="mb-2 text-foreground text-sm sm:text-base">
                  Pricing Settings
                </h2>
                <div className="h-1 w-16 rounded-full bg-accent" />
              </div>

              <div className="space-y-6">
                {/* Ticket Purchases Master Toggle */}
                <div
                  className={`rounded-lg border-2 p-4 transition-colors ${
                    ticketPurchasesEnabled
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor="ticket-purchases-toggle"
                          className="text-base cursor-pointer"
                        >
                          Enable Ticket Purchases
                        </Label>
                        {ticketPurchasesEnabled ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Lock className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <p
                        className={`text-sm ${
                          ticketPurchasesEnabled
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {ticketPurchasesEnabled
                          ? "✅ Customers can purchase tickets and make bookings"
                          : "🔒 All dates show as SOLD OUT - Safe for testing"}
                      </p>
                    </div>
                    <Switch
                      id="ticket-purchases-toggle"
                      checked={ticketPurchasesEnabled}
                      onCheckedChange={toggleTicketPurchases}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="basePrice">
                      Adult Day Pass Price (€)
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricing.basePrice}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          basePrice:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="childPrice">
                      Child Day Pass Price (€)
                      <span className="ml-2 text-xs text-muted-foreground">Ages 7-12</span>
                    </Label>
                    <Input
                      id="childPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricing.childPrice}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          childPrice:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 border-border"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="guidedSurcharge">
                      Guided Tour Surcharge (€)
                    </Label>
                    <Input
                      id="guidedSurcharge"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricing.guidedTourSurcharge}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          guidedTourSurcharge:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 border-border"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Preview:</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Adult: <strong className="text-foreground">€{pricing.basePrice.toFixed(2)}</strong></li>
                    <li>• Child (7-12): <strong className="text-foreground">€{pricing.childPrice.toFixed(2)}</strong></li>
                    <li>• Insight Tour add-on: <strong className="text-foreground">+€{pricing.guidedTourSurcharge.toFixed(2)}</strong> per person</li>
                  </ul>
                </div>

                <Button
                  onClick={saveSettings}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Pricing
                </Button>

                {/* Wallet Payments Info */}
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-blue-900">
                        <strong>
                          Enable Apple Pay & Google Pay
                        </strong>
                      </p>
                      <p className="text-xs text-blue-800">
                        To allow customers to pay with Apple Pay
                        and Google Pay, enable these payment
                        methods in your Stripe Dashboard:
                      </p>
                      <ol className="text-xs text-blue-800 list-decimal list-inside space-y-1 ml-2">
                        <li>
                          Go to{" "}
                          <a
                            href="https://dashboard.stripe.com/settings/payment_methods"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            Stripe Dashboard → Settings →
                            Payment methods
                          </a>
                        </li>
                        <li>
                          Enable "Apple Pay" and "Google Pay"
                        </li>
                        <li>
                          For Apple Pay: Add and verify your
                          domain
                        </li>
                        <li>
                          Wallet buttons will automatically
                          appear for compatible devices
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Attraction Ticket Prices */}
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
                          step="0.01"
                          value={attraction.price}
                          onChange={(e) =>
                            updateAttractionPrice(
                              id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="border-border"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={saveSettings}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Attraction Prices
                </Button>
              </div>
            </Card>

            {/* Availability Management */}
            <Card className="border-border p-8">
              <div className="mb-6">
                <h2 className="mb-2 text-foreground">
                  Availability Management
                </h2>
                <div className="h-1 w-16 rounded-full bg-accent" />
              </div>

              <div className="space-y-6">
                <div>
                  <Label>Select Date</Label>
                  <Popover
                    open={calendarOpen}
                    onOpenChange={setCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full justify-start border-border text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {new Date(
                          selectedDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDate)}
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
                          max="50"
                          value={
                            availability[selectedDate]?.[
                              slot
                            ] ?? 50
                          }
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

                  <div className="mt-6">
                    <Button
                      onClick={saveSettings}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Availability
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ====== DRIVERS TAB ====== */}
          <TabsContent
            value="drivers"
            className="space-y-4 sm:space-y-6"
          >
            <DriverManagement />
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

          {/* ====== PRIVATE TOURS TAB ====== */}
          <TabsContent value="private-tours" className="space-y-6">
            <PrivateTourManager />
          </TabsContent>

          {/* ====== TOUR REQUESTS TAB ====== */}
          <TabsContent value="tour-requests" className="space-y-6">
            <TourRequestsManagement />
          </TabsContent>

          {/* ====== SEO TAB ====== */}
          <TabsContent value="seo" className="space-y-6">
            <SEOTools />
          </TabsContent>

          {/* ====== TAGS TAB ====== */}
          <TabsContent value="tags" className="space-y-6">
            <TagManagement />
          </TabsContent>

          {/* ====== LOGS TAB ====== */}
          <TabsContent value="logs" className="space-y-6">
            <BookingLogs />
          </TabsContent>

          {/* ====== CLEANUP TAB ====== */}
          <TabsContent value="cleanup" className="space-y-6">
            <BookingDiagnostics />
            <DatabaseCleanup adminPassword="Sintra2025" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;