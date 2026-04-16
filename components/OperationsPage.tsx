import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { QrCode, Ticket, Home, Users, Clock, CheckCircle2, MapPin, Car, AlertCircle, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from '../lib/apiErrorHandler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

interface OperationsPageProps {
  onNavigate: (page: string) => void;
}

export function OperationsPage({ onNavigate }: OperationsPageProps) {
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
    document.title = 'Operations Portal - Access Restricted';
  }, []);

  const [driverSession, setDriverSession] = useState<any>(() => {
    // Check for existing driver session in localStorage
    const sessionStr = localStorage.getItem("driver_session");
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if driver is logged in
    const sessionStr = localStorage.getItem("driver_session");
    return !!sessionStr;
  });
  const [pickupRequests, setPickupRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("operations-sound") !== "false";
  });

  const handleLogout = () => {
    localStorage.removeItem("driver_session");
    setDriverSession(null);
    setIsAuthenticated(false);
    onNavigate("driver-login");
  };

  // Load active pickup requests
  const loadPickupRequests = async () => {
    if (!isAuthenticated) return;
    
    // Prevent overlapping requests
    if (loadingRequests) {
      console.log('⏭️ Skipping fetch - already loading');
      return;
    }
    
    setLoadingRequests(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup/active`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Server returned non-JSON response:', contentType);
        console.error('Response status:', response.status);
        const text = await response.text();
        console.error('Response body:', text.substring(0, 500));
        setPickupRequests([]);
        setLoadingRequests(false);
        return;
      }
      
      const result = await response.json();
      
      if (result?.success) {
        setPickupRequests(result.requests || []);
      } else {
        console.error('API returned error:', result);
        setPickupRequests([]);
      }
    } catch (error) {
      console.error('Error loading pickup requests:', error);
      setPickupRequests([]);
    }
    
    setLoadingRequests(false);
  };

  // Update pickup request status
  const updatePickupStatus = async (requestId: string, status: string) => {
    try {
      const body: any = { status };
      
      // If accepting, include driver name
      if (status === "accepted" && driverSession?.driver?.name) {
        body.driverName = driverSession.driver.name;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup/${requestId}/status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        if (status === "accepted") {
          toast.success(`You accepted the pickup request`);
        } else {
          toast.success(`Pickup request ${status}`);
        }
        loadPickupRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating pickup request:", error);
      toast.error("Failed to update pickup request. Please try again.");
    }
  };

  // Request notification permission
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Notifications enabled! You\'ll be alerted of new pickup requests.');
        }
      });
    }
  }, [isAuthenticated]);

  // Load pickup requests on mount and set up polling
  useEffect(() => {
    if (isAuthenticated) {
      loadPickupRequests();
      
      // Set up realtime subscription as primary update mechanism
      const supabase = createClient();
      const channel = supabase
        .channel('operations-pickup-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kv_store_3bd0ade8',
          },
          (payload) => {
            // Filter for pickup request keys or the active_pickup_requests list
            const key = payload.new?.key;
            console.log('📡 Realtime change detected, key:', key);
            
            if (!key) {
              console.log('⚠️ No key in payload, ignoring');
              return;
            }
            
            if (key.startsWith('pickup_request:') || key === 'active_pickup_requests') {
              console.log('🚗 Realtime pickup request change detected in Operations:', payload);
              // Reload requests when any pickup request changes
              loadPickupRequests();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Operations pickup requests subscription active');
          } else {
            console.log('📡 Subscription status:', status);
          }
        });
      
      // Set up light polling (every 30 seconds) as fallback only
      const pollInterval = setInterval(() => {
        console.log('🔄 Fallback poll for pickup requests...');
        loadPickupRequests();
      }, 30000); // Poll every 30 seconds as fallback
      
      return () => {
        console.log('🔌 Unsubscribing from operations pickup requests channel');
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  // Show notification and play sound when new pickup requests arrive
  useEffect(() => {
    if (pickupRequests.length > 0) {
      // Check if this is a new request by comparing with previous count
      const previousCount = parseInt(sessionStorage.getItem('pickupRequestCount') || '0');
      if (pickupRequests.length > previousCount) {
        const newRequests = pickupRequests.length - previousCount;
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('���� New Pickup Request!', {
            body: `${newRequests} new pickup request${newRequests > 1 ? 's' : ''} waiting`,
            icon: '/icon-72x72.png',
            badge: '/icon-72x72.png',
            requireInteraction: true, // Keep notification visible
          });
        }

        // Play sound notification
        if (soundEnabled) {
          try {
            // Create a simple notification beep
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // Hz
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            
            // Second beep
            setTimeout(() => {
              const osc2 = audioContext.createOscillator();
              const gain2 = audioContext.createGain();
              osc2.connect(gain2);
              gain2.connect(audioContext.destination);
              osc2.frequency.value = 1000;
              gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
              osc2.start(audioContext.currentTime);
              osc2.stop(audioContext.currentTime + 0.2);
            }, 300);
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }

        // Show toast notification
        toast.success(`New pickup request${newRequests > 1 ? 's' : ''}!`, {
          description: `${newRequests} customer${newRequests > 1 ? 's' : ''} waiting for pickup`,
        });
      }
      sessionStorage.setItem('pickupRequestCount', pickupRequests.length.toString());
    }
  }, [pickupRequests, soundEnabled]);

  // Redirect to driver login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !driverSession) {
      onNavigate("driver-login");
    }
  }, [isAuthenticated, driverSession]);

  // Login screen
  if (!isAuthenticated || !driverSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-8">
        <Card className="w-full max-w-md border-border p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="mb-2 text-foreground">Operations Portal</h1>
            <p className="text-muted-foreground">Redirecting to driver login...</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => onNavigate("driver-login")}
              className="w-full"
              size="lg"
            >
              Go to Driver Login
            </Button>

            <div className="mt-6 rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">For drivers only.</strong>
                <br />
                Contact admin if you need access.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Operations Dashboard
  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => onNavigate("home")}
            className="mb-4"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Website
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-foreground">Operations Portal</h1>
                  {driverSession?.driver && (
                    <p className="text-sm text-muted-foreground">
                      Driver: {driverSession.driver.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-1 w-20 rounded-full bg-accent" />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newValue = !soundEnabled;
                  setSoundEnabled(newValue);
                  localStorage.setItem("operations-sound", newValue.toString());
                  toast.success(newValue ? 'Sound alerts enabled' : 'Sound alerts disabled');
                }}
              >
                {soundEnabled ? '🔔 Sound On' : '🔕 Sound Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for Pickup Requests and QR/Sales */}
        <Tabs defaultValue="pickup-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pickup-requests" className="relative">
              <AlertCircle className="mr-2 h-4 w-4" />
              Pickup Requests
              {pickupRequests.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-5 min-w-[20px] rounded-full px-1.5 text-xs animate-pulse"
                >
                  {pickupRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="qr-sales">
              <QrCode className="mr-2 h-4 w-4" />
              QR Scanner & Sales
            </TabsTrigger>
          </TabsList>

          {/* Pickup Requests Tab */}
          <TabsContent value="pickup-requests" className="space-y-6">
            {pickupRequests.length > 0 ? (
              <Card className="border-accent/50 bg-accent/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                      <AlertCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-foreground">Active Pickup Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        {pickupRequests.length} customer{pickupRequests.length !== 1 ? 's' : ''} waiting
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPickupRequests}
                    disabled={loadingRequests}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-3">
                  {pickupRequests.map((request) => {
                    const locations = [
                      { id: "sintra-station", name: "Sintra Train Station" },
                      { id: "pena-palace", name: "Pena Palace" },
                      { id: "quinta-regaleira", name: "Quinta da Regaleira" },
                      { id: "moorish-castle", name: "Moorish Castle" },
                      { id: "monserrate-palace", name: "Monserrate Palace" },
                      { id: "sintra-palace", name: "Sintra National Palace" },
                      { id: "town-center", name: "Historic Town Center" },
                    ];
                    
                    const locationName = locations.find(l => l.id === request.location)?.name || request.location;
                    const destinationName = request.destination 
                      ? locations.find(l => l.id === request.destination)?.name || request.destination
                      : null;
                    
                    const timeAgo = new Date(request.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });

                    const isAccepted = request.status === "accepted";
                    const cardBorderColor = isAccepted ? "border-green-300" : "border-border";
                    const cardBgColor = isAccepted ? "bg-green-50" : "bg-white";

                    return (
                      <div key={request.id} className={`rounded-lg border ${cardBorderColor} ${cardBgColor} p-4`}>
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <Users className={`h-4 w-4 ${isAccepted ? 'text-green-600' : 'text-accent'}`} />
                              <span className="text-foreground">
                                {request.groupSize} passenger{request.groupSize !== 1 ? 's' : ''}
                              </span>
                              {request.vehiclesNeeded > 1 && (
                                <span className={`rounded-full px-2 py-0.5 text-xs ${isAccepted ? 'bg-green-100 text-green-700' : 'bg-accent/10 text-accent'}`}>
                                  {request.vehiclesNeeded} vehicles needed
                                </span>
                              )}
                            </div>
                            {/* Customer Name */}
                            {request.customerName && (
                              <p className="text-sm font-medium text-foreground mb-1">
                                {request.customerName}
                              </p>
                            )}
                            {/* Phone Number */}
                            {request.customerPhone && (
                              <p className="text-xs text-muted-foreground mb-1">
                                📞 {request.customerPhone}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">Requested at {timeAgo}</p>
                            {isAccepted && request.driverName && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <p className="text-sm font-medium text-green-700">
                                  Accepted by {request.driverName}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isAccepted ? 'text-green-600' : 'text-accent'}`} />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Pickup Location</p>
                              <p className="text-foreground">{locationName}</p>
                            </div>
                          </div>
                          
                          {destinationName && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Destination</p>
                                <p className="text-foreground">{destinationName}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!isAccepted && (
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updatePickupStatus(request.id, "accepted")}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Accept
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className={`${isAccepted ? 'flex-1' : ''} bg-accent hover:bg-accent/90`}
                            onClick={() => updatePickupStatus(request.id, "completed")}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePickupStatus(request.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-foreground">No Active Requests</h3>
                <p className="text-muted-foreground">
                  All pickup requests have been completed. New requests will appear here automatically.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* QR Scanner & Sales Tab */}
          <TabsContent value="qr-sales" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* QR Scanner */}
              <Card 
                className="group border-2 border-primary/30 p-8 transition-all hover:border-primary hover:shadow-lg cursor-pointer active:scale-95 min-h-[200px] flex flex-col items-center justify-center text-center" 
                onClick={() => onNavigate("qr-scanner")}
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-14 w-14 text-primary" />
                </div>
                <h2 className="text-foreground">QR Scanner</h2>
                <p className="mt-2 text-sm text-muted-foreground">Scan and validate customer tickets</p>
              </Card>

              {/* Manual Booking */}
              <Card 
                className="group border-2 border-accent/30 p-8 transition-all hover:border-accent hover:shadow-lg cursor-pointer active:scale-95 min-h-[200px] flex flex-col items-center justify-center text-center" 
                onClick={() => onNavigate("manual-booking")}
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Ticket className="h-14 w-14 text-accent" />
                </div>
                <h2 className="text-foreground">Manual Booking</h2>
                <p className="mt-2 text-sm text-muted-foreground">Create tickets for walk-in customers</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>


      </div>
    </div>
  );
}

export default OperationsPage;