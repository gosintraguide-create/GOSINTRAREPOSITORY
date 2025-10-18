import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin, Users, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DestinationStat {
  destination: string;
  count: number;
}

interface DestinationTrackerProps {
  autoRefresh?: boolean;
}

export function DestinationTracker({ autoRefresh = true }: DestinationTrackerProps) {
  const [stats, setStats] = useState<DestinationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/destinations/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
      const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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
            Destination Tracker
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
          Live passenger distribution across destinations
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
            {stats.map((stat) => (
              <div
                key={stat.destination}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-foreground">{stat.destination}</span>
                </div>
                <span className="font-medium text-foreground">{stat.count} pax</span>
              </div>
            ))}

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
