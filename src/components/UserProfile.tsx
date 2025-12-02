import { useState, useEffect } from "react";
import { User, LogOut, Ticket, Car, Map } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getSession, clearSession, verifyAndLogin, type UserSession } from "../lib/sessionManager";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface UserProfileProps {
  onNavigate: (page: string) => void;
  language: string;
}

export function UserProfile({ onNavigate, language }: UserProfileProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const currentSession = getSession();
    setSession(currentSession);

    // Listen for session changes (login/logout from other components)
    const handleSessionChange = (event: CustomEvent) => {
      setSession(event.detail);
    };

    window.addEventListener('sessionChanged', handleSessionChange as EventListener);
    
    return () => {
      window.removeEventListener('sessionChanged', handleSessionChange as EventListener);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId.trim() || !lastName.trim()) {
      toast.error("Please enter both booking ID and last name");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyAndLogin(bookingId, lastName, projectId, publicAnonKey);

      if (result.success && result.session) {
        setSession(result.session);
        setIsLoginOpen(false);
        setBookingId("");
        setLastName("");
        toast.success(`Welcome back, ${result.session.customerName}!`);
        
        // If there's a pending navigation, navigate after login
        if (pendingNavigation) {
          onNavigate(pendingNavigation);
          setPendingNavigation(null);
        }
      } else {
        toast.error(result.error || "Invalid booking credentials");
      }
    } catch (error) {
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtectedNavigation = (page: string) => {
    if (!session) {
      // Store the intended destination and show login dialog
      setPendingNavigation(page);
      setIsLoginOpen(true);
    } else {
      // Already logged in, navigate directly
      onNavigate(page);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    toast.success("You've been logged out");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!session) {
    // Show login button with dropdown for quick access
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Account</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Login to Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleProtectedNavigation("manage-booking")}>
              <Ticket className="mr-2 h-4 w-4" />
              My Booking
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleProtectedNavigation("request-pickup")}>
              <Car className="mr-2 h-4 w-4" />
              Request a Ride
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isLoginOpen} onOpenChange={(open) => {
          setIsLoginOpen(open);
          if (!open) {
            // Clear pending navigation if dialog is closed
            setPendingNavigation(null);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Access Your Booking</DialogTitle>
              <DialogDescription>
                Login with your booking ID and last name to access your temporary profile during your visit.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input
                  id="bookingId"
                  placeholder="e.g., AB1234"
                  value={bookingId}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    
                    // Auto-format: 2 letters + dash + 4 numbers
                    if (value.length > 2) {
                      value = value.slice(0, 2) + '-' + value.slice(2, 6);
                    }
                    
                    setBookingId(value);
                  }}
                  className="uppercase"
                  disabled={isLoading}
                  maxLength={7}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="As provided during booking"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Login"}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-accent text-accent hover:bg-accent hover:text-white"
                onClick={() => {
                  setIsLoginOpen(false);
                  onNavigate("buy-ticket");
                }}
              >
                Buy Day Pass
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your profile will be accessible until the day after your visit date.
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show user profile dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:inline max-w-[120px] truncate">
            {session.customerName.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="font-medium">{session.customerName}</p>
            <p className="text-xs text-muted-foreground">{session.customerEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => {
          onNavigate("manage-booking");
        }}>
          <Ticket className="mr-2 h-4 w-4" />
          View My Booking
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => {
          onNavigate("request-pickup");
        }}>
          <Car className="mr-2 h-4 w-4" />
          Request a Ride
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => {
          onNavigate("route-map");
        }}>
          <Map className="mr-2 h-4 w-4" />
          View Stops Map
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>

        <div className="px-2 py-2">
          <p className="text-xs text-center text-muted-foreground">
            Profile active until {formatDate(session.expiresAt)}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
