import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin, Users, RefreshCw, ChevronDown, ChevronRight, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

interface Passenger {
  customerName: string;
  bookingId: string;
  passengerIndex: number;
  timestamp: string;
}

interface DestinationStat {
  destination: string;
  count: number;
  passengers?: Passenger[];
}

interface DestinationTrackerProps {
  autoRefresh?: boolean;
  showDetails?: boolean;
}

export function DestinationTracker({ autoRefresh = true, showDetails = false }: DestinationTrackerProps) {
  const [stats, setStats] = useState<DestinationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set());

  const toggleDestination = (destination: string) => {
    const newExpanded = new Set(expandedDestinations);
    if (newExpanded.has(destination)) {
      newExpanded.delete(destination);
    } else {
      newExpanded.add(destination);
    }
    setExpandedDestinations(newExpanded);
  };

  const loadStats = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/destinations/stats${showDetails ? '?details=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error loading destination stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    if (autoRefresh) {
      // Set up realtime subscription for instant check-in updates
      const supabase = createClient();
      const channel = supabase
        .channel('destination-stats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kv_store_3bd0ade8',
            filter: 'key=like.booking_%'
          },
          (payload) => {
            console.log('Realtime booking/check-in change detected:', payload);
            // Reload stats when any booking changes (check-ins are part of bookings)
            loadStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [autoRefresh, showDetails]);

  const totalPassengers = stats.reduce((sum, stat) => sum + stat.count, 0);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Destination Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {showDetails ? "Passenger Locations" : "Destination Tracker"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStats}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {showDetails 
            ? "Real-time view of where passengers are right now" 
            : "Live passenger distribution across destinations"}
        </p>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No check-ins yet today</p>
            <p className="text-sm mt-1">Passenger destinations will appear here after check-in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Total Passengers</span>
              </div>
              <span className="text-xl font-bold text-primary">{totalPassengers} pax</span>
            </div>

            {/* Destinations */}
            {stats.map((stat) => {
              const isExpanded = expandedDestinations.has(stat.destination);
              const hasPassengers = showDetails && stat.passengers && stat.passengers.length > 0;
              
              return (
                <div key={stat.destination}>
                  {hasPassengers ? (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleDestination(stat.destination)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-accent" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-accent" />
                            )}
                            <MapPin className="h-4 w-4 text-accent" />
                            <span className="text-foreground">{stat.destination}</span>
                          </div>
                          <Badge variant="secondary" className="font-medium">
                            {stat.count} pax
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-2 space-y-1 border-l-2 border-accent/20 pl-3">
                          {stat.passengers?.map((passenger, idx) => (
                            <div
                              key={`${passenger.bookingId}-${passenger.passengerIndex}`}
                              className="flex items-center justify-between p-2 rounded bg-background/50 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-foreground">{passenger.customerName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(passenger.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-foreground">{stat.destination}</span>
                      </div>
                      <span className="font-medium text-foreground">{stat.count} pax</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Last Update */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Last updated: {lastUpdate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
