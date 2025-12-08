import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { QrCode, Ticket, Home, Users, Clock, CheckCircle2, MapPin, Car, AlertCircle, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from '../lib/apiErrorHandler';

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
    
    setLoadingRequests(true);
    
    const result = await safeJsonFetch<any>(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup/active`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (result?.success) {
      setPickupRequests(result.requests || []);
    } else {
      setPickupRequests([]);
    }
    
    setLoadingRequests(false);
  };

  // Update pickup request status
  const updatePickupStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup/${requestId}/status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success(`Pickup request ${status}`);
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
      
      // Set up realtime subscription for instant pickup request updates
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
            // Filter for pickup request keys only
            const key = payload.new?.key;
            if (!key || !key.startsWith('pickup_request:')) {
              return;
            }
            
            console.log('🚗 Realtime pickup request change detected in Operations:', payload);
            // Reload requests when any pickup request changes
            loadPickupRequests();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Operations pickup requests subscription active');
          }
        });
      
      return () => {
        console.log('🔌 Unsubscribing from operations pickup requests channel');
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
          new Notification('🚗 New Pickup Request!', {
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
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <p className="text-sm text-blue-900">
              <strong>Real-time updates enabled:</strong> Pickup requests update instantly via realtime subscriptions. Sound and browser notifications will alert you of new requests.
            </p>
          </div>
        </div>

        {/* Active Pickup Requests */}
        {pickupRequests.length > 0 && (
          <Card className="mb-8 border-accent/50 bg-accent/5 p-6">
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

                return (
                  <div key={request.id} className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Users className="h-4 w-4 text-accent" />
                          <span className="text-foreground">
                            {request.groupSize} passenger{request.groupSize !== 1 ? 's' : ''}
                          </span>
                          {request.vehiclesNeeded > 1 && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                              {request.vehiclesNeeded} vehicles needed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Requested at {timeAgo}</p>
                      </div>
                    </div>

                    <div className="mb-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
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
                      <Button
                        size="sm"
                        className="flex-1 bg-accent hover:bg-accent/90"
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
        )}

        {/* Main Actions */}
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
          </Card>
        </div>


      </div>
    </div>
  );
}

export default OperationsPage;