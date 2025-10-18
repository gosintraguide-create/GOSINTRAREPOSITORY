import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Eye, EyeOff, QrCode, Ticket, Home, Users, Clock, CheckCircle2, MapPin, Car, AlertCircle, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { safeJsonFetch } from '../lib/apiErrorHandler';

interface OperationsPageProps {
  onNavigate: (page: string) => void;
}

export function OperationsPage({ onNavigate }: OperationsPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check for existing session in localStorage (persistent)
    const session = localStorage.getItem("operations-session");
    return session === "authenticated";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pickupRequests, setPickupRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("operations-sound") !== "false";
  });

  const handleLogin = () => {
    // Operations password - different from admin
    if (password === "driver2025") {
      setIsAuthenticated(true);
      localStorage.setItem("operations-session", "authenticated");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
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
      
      // Poll for new requests every 10 seconds
      const interval = setInterval(() => {
        loadPickupRequests();
      }, 10000);

      return () => clearInterval(interval);
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

  // Login screen
  if (!isAuthenticated) {
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
            <p className="text-muted-foreground">For drivers and field staff</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter operations password"
                  className={error ? "border-destructive" : ""}
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
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>

            <div className="mt-6 rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">For drivers only.</strong>
                <br />
                Contact admin if you need access.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => onNavigate("home")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Website
            </Button>
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
                <h1 className="text-foreground">Operations Portal</h1>
              </div>
              <div className="h-1 w-20 rounded-full bg-accent" />
            </div>
            
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
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <p className="text-sm text-blue-900">
              <strong>Auto-refresh enabled:</strong> Pickup requests update every 10 seconds. Sound and browser notifications will alert you of new requests.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operating Hours</p>
                <p className="text-foreground">9:00 AM - 8:00 PM</p>
              </div>
            </div>
          </Card>

          <Card className="border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Frequency</p>
                <p className="text-foreground">Every 10-15 min</p>
              </div>
            </div>
          </Card>

          <Card className="border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${pickupRequests.length > 0 ? 'bg-accent/10' : 'bg-primary/10'}`}>
                <Car className={`h-5 w-5 ${pickupRequests.length > 0 ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Requests</p>
                <p className="text-foreground">{pickupRequests.length} pickup{pickupRequests.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>
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
          <Card className="group border-border p-6 transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer" onClick={() => onNavigate("qr-scanner")}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-foreground">QR Code Scanner</h3>
            <p className="mb-4 text-muted-foreground">
              Scan customer tickets to check them in. Quick and easy validation.
            </p>
            <Button className="w-full" onClick={(e) => {
              e.stopPropagation();
              onNavigate("qr-scanner");
            }}>
              Open Scanner
            </Button>
          </Card>

          {/* Manual Booking */}
          <Card className="group border-border p-6 transition-all hover:border-accent/50 hover:shadow-lg cursor-pointer" onClick={() => onNavigate("manual-booking")}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Ticket className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mb-2 text-foreground">Manual Booking</h3>
            <p className="mb-4 text-muted-foreground">
              Create tickets for walk-in customers. Accept cash or card payments in person.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-accent text-accent hover:bg-accent hover:text-white" 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate("manual-booking");
              }}
            >
              Create Booking
            </Button>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8 border-border p-6 bg-secondary/50">
          <h3 className="mb-4 text-foreground">Quick Guide</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm">
                1
              </div>
              <div>
                <p className="text-foreground">QR Code Scanner</p>
                <p className="text-sm text-muted-foreground">
                  Use this to check in customers who already have tickets. Scan their QR code from email or phone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm">
                2
              </div>
              <div>
                <p className="text-foreground">Manual Booking</p>
                <p className="text-sm text-muted-foreground">
                  Create new bookings for walk-in customers. Collect payment and issue tickets immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-sm">
                3
              </div>
              <div>
                <p className="text-foreground">Stay Logged In</p>
                <p className="text-sm text-muted-foreground">
                  Your login stays active even after closing the browser. No need to re-enter password.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact operations manager or admin support.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            WhatsApp: <a href="https://wa.me/351932967279" className="text-primary hover:underline">+351 932 967 279</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OperationsPage;
