import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LogOut, 
  TrendingUp, 
  Ticket, 
  QrCode, 
  DollarSign, 
  Calendar,
  Activity,
  Navigation,
  AlertCircle,
  Users,
  MapPin,
  CheckCircle,
  Plus,
  CreditCard,
  Banknote,
  Power,
  PowerOff
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { SellTicketsForm } from './SellTicketsForm';
import { useWakeLock } from '../hooks/useWakeLock';
import { useBackgroundSync } from '../hooks/useBackgroundSync';

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

interface DriverDashboardProps {
  driver: any;
  token: string;
  onLogout: () => void;
}

export function DriverDashboard({ driver, token, onLogout }: DriverDashboardProps) {
  const { onNavigate } = useOutletContext<OutletContext>();
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, requestWakeLock, releaseWakeLock } = useWakeLock();
  const [keepAwake, setKeepAwake] = useState(() => {
    // Remember user's preference
    return localStorage.getItem('driver-keep-awake') === 'true';
  });
  const { isSupported: backgroundSyncSupported, registerBackgroundSync } = useBackgroundSync();

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
    document.title = 'Driver Dashboard - Access Restricted';
  }, []);

  const [metrics, setMetrics] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [chartKey, setChartKey] = useState(0);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Handle wake lock to keep screen on
  useEffect(() => {
    if (keepAwake && wakeLockSupported) {
      requestWakeLock().then((success) => {
        if (success) {
          toast.success('🔒 Screen will stay on while app is active', {
            description: 'Your device won\'t sleep during your shift',
            duration: 3000,
          });
        }
      });
    } else if (!keepAwake && wakeLockActive) {
      releaseWakeLock();
    }
  }, [keepAwake, wakeLockSupported]);

  // Toggle keep awake feature
  const toggleKeepAwake = async () => {
    const newState = !keepAwake;
    setKeepAwake(newState);
    localStorage.setItem('driver-keep-awake', String(newState));
    
    if (!newState && wakeLockActive) {
      await releaseWakeLock();
      toast.info('Screen can now sleep normally');
    }
  };

  // Background sync to refresh data every 30 seconds
  useBackgroundSync(() => {
    // Refresh availability data in background
    loadPendingRequests();
    loadAcceptedRequests();
  }, 30000); // 30 seconds

  useEffect(() => {
    loadMetrics();
    loadActivity();
    loadPendingRequests();
    loadAcceptedRequests();
    // Note: Requests refresh via realtime subscriptions in pickup request components
  }, [driver.id]);

  const loadMetrics = async () => {
    try {
      // Get last 30 days of metrics
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/${driver.id}/metrics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Remove duplicate dates and add unique IDs
        const metricsMap = new Map();
        data.metrics.forEach((item: any) => {
          if (item.date) {
            // If date already exists, merge the data
            if (metricsMap.has(item.date)) {
              const existing = metricsMap.get(item.date);
              metricsMap.set(item.date, {
                date: item.date,
                ticketsSold: (existing.ticketsSold || 0) + (item.ticketsSold || 0),
                revenue: (existing.revenue || 0) + (item.revenue || 0),
                qrScans: (existing.qrScans || 0) + (item.qrScans || 0)
              });
            } else {
              metricsMap.set(item.date, {
                date: item.date,
                ticketsSold: item.ticketsSold || 0,
                revenue: item.revenue || 0,
                qrScans: item.qrScans || 0
              });
            }
          }
        });
        
        // Convert to array, sort by date, and add unique numeric indices
        const uniqueMetrics = Array.from(metricsMap.values())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((item, index) => ({
            ...item,
            index: index,
            uniqueId: `metric-${index}-${item.date.replace(/-/g, '')}`
          }));
        
        console.log('Loaded metrics:', uniqueMetrics.length, 'unique dates');
        setMetrics(uniqueMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/${driver.id}/activity?limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setActivity(data.activity);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests/pending`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        console.error('Server returned error:', response.status, response.statusText);
        return;
      }

      const text = await response.text();
      if (!text) {
        console.error('Empty response from server');
        return;
      }

      try {
        const data = JSON.parse(text);
        if (data.success) {
          setPendingRequests(data.requests);
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', text.substring(0, 200));
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadAcceptedRequests = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        console.error('Server returned error:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Filter for requests accepted by this driver
        const myAccepted = data.requests.filter(
          (req: any) => req.status === 'accepted' && req.acceptedBy === driver.id
        );
        setAcceptedRequests(myAccepted);
      }
    } catch (error) {
      console.error('Error loading accepted requests:', error);
    }
  };

  const acceptPickupRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests/${requestId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            driverId: driver.id,
            driverName: driver.name
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        loadPendingRequests();
        loadAcceptedRequests();
      }
    } catch (error) {
      console.error('Error accepting pickup request:', error);
    }
  };

  const completePickupRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests/${requestId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        loadAcceptedRequests();
      }
    } catch (error) {
      console.error('Error completing pickup request:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Update driver status to offline
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ driverId: driver.id })
        }
      );
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('driver_session');
      onLogout();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todayMetrics = metrics.find(m => m.date === today) || {
    ticketsSold: 0,
    revenue: 0,
    qrScans: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0A4D5C] text-white py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Driver Portal</h1>
              <p className="text-[#FFF4ED]/80 text-sm">Welcome, {driver.name}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          {/* Keep Awake Toggle */}
          {wakeLockSupported && (
            <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                {wakeLockActive ? (
                  <Power className="h-4 w-4 text-green-300" />
                ) : (
                  <PowerOff className="h-4 w-4 text-white/60" />
                )}
                <div>
                  <p className="text-sm font-medium">Keep Screen Awake</p>
                  <p className="text-xs text-white/70">
                    {wakeLockActive ? 'Active - Screen won\'t sleep' : 'Inactive - Screen can sleep'}
                  </p>
                </div>
              </div>
              <Button
                onClick={toggleKeepAwake}
                size="sm"
                variant={keepAwake ? "default" : "outline"}
                className={keepAwake 
                  ? "bg-green-500 hover:bg-green-600 text-white border-none" 
                  : "bg-transparent border-white text-white hover:bg-white/10"
                }
              >
                {keepAwake ? 'ON' : 'OFF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="stats">Statistics & Info</TabsTrigger>
          </TabsList>

          {/* QUICK ACTIONS TAB */}
          <TabsContent value="actions" className="space-y-6">
            {/* Urgent Notifications */}
            {acceptedRequests.length > 0 && (
              <Card className="border-blue-500 border-2 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      {acceptedRequests.length} Active Pickup{acceptedRequests.length > 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {acceptedRequests.map((request: any) => (
                      <div key={request.id} className="bg-white p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{request.customerName}</p>
                            <p className="text-xs text-gray-600 truncate">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {request.pickupLocation}
                            </p>
                          </div>
                          <Button
                            onClick={() => completePickupRequest(request.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingRequests.length > 0 && (
              <Card className="border-yellow-500 border-2 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">
                      {pendingRequests.length} Pending Pickup Request{pendingRequests.length > 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {pendingRequests.slice(0, 2).map((request: any) => (
                      <div key={request.id} className="bg-white p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{request.customerName}</p>
                            <p className="text-xs text-gray-600 truncate">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {request.pickupLocation}
                            </p>
                          </div>
                          <Button
                            onClick={() => acceptPickupRequest(request.id)}
                            size="sm"
                            className="bg-[#0A4D5C] hover:bg-[#0A4D5C]/90 flex-shrink-0"
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingRequests.length > 2 && (
                      <p className="text-sm text-yellow-800 text-center pt-1">
                        + {pendingRequests.length - 2} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              {/* Scan QR Button */}
              <button
                onClick={() => onNavigate('qr-scanner', { returnTo: 'driver-portal' })}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A4D5C] to-[#0A4D5C]/80 p-8 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-100"
              >
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="rounded-full bg-white/20 p-6">
                    <QrCode className="h-16 w-16" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-1">Scan QR Code</h2>
                    <p className="text-white/80 text-sm">Validate customer tickets</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>

            {/* Sell Tickets Form (always visible) */}
            <div className="mt-6">
              <SellTicketsForm 
                driverId={driver.id} 
                onSaleComplete={() => {
                  loadMetrics();
                  loadActivity();
                }} 
              />
            </div>

            {/* Today's Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Activity</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#D97843]">{todayMetrics.ticketsSold}</div>
                    <div className="text-xs text-gray-500 mt-1">Tickets Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">€{todayMetrics.revenue.toFixed(0)}</div>
                    <div className="text-xs text-gray-500 mt-1">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#0A4D5C]">{todayMetrics.qrScans}</div>
                    <div className="text-xs text-gray-500 mt-1">QR Scans</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTICS & INFO TAB */}
          <TabsContent value="stats" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-[#D97843]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driver.totalTicketsSold || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {todayMetrics.ticketsSold} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{(driver.totalRevenue || 0).toFixed(2)}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    €{todayMetrics.revenue.toFixed(2)} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Scans</CardTitle>
                  <QrCode className="h-4 w-4 text-[#0A4D5C]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driver.totalQRScans || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {todayMetrics.qrScans} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    <Badge className="bg-green-500">{driver.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {driver.vehicleType || 'Not set'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Activity */}
            <Tabs defaultValue="charts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="charts">Performance Charts</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="pickups">Pickup Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Revenue Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
                      <CardDescription>Daily revenue generated</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250} key={`revenue-chart-${metrics.length}`}>
                          <LineChart 
                            data={metrics}
                            id="revenue-line-chart"
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="uniqueId"
                              tickFormatter={(id) => {
                                const item = metrics.find(m => m.uniqueId === id);
                                return item ? formatDate(item.date) : '';
                              }}
                              fontSize={12}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip 
                              formatter={(value: any) => `€${value.toFixed(2)}`}
                              labelFormatter={(id) => {
                                const item = metrics.find(m => m.uniqueId === id);
                                return item ? formatDate(item.date) : '';
                              }}
                            />
                            <Line 
                              key="line-revenue"
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#D97843" 
                              strokeWidth={2}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tickets & Scans Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets & Scans (Last 30 Days)</CardTitle>
                      <CardDescription>Daily activity overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250} key={`tickets-chart-${metrics.length}`}>
                          <BarChart 
                            data={metrics}
                            id="tickets-bar-chart"
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="uniqueId"
                              tickFormatter={(id) => {
                                const item = metrics.find(m => m.uniqueId === id);
                                return item ? formatDate(item.date) : '';
                              }}
                              fontSize={12}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip 
                              labelFormatter={(id) => {
                                const item = metrics.find(m => m.uniqueId === id);
                                return item ? formatDate(item.date) : '';
                              }}
                            />
                            <Bar 
                              key="bar-tickets"
                              dataKey="ticketsSold" 
                              fill="#D97843" 
                              name="Tickets Sold"
                              isAnimationActive={false}
                            />
                            <Bar 
                              key="bar-scans"
                              dataKey="qrScans" 
                              fill="#0A4D5C" 
                              name="QR Scans"
                              isAnimationActive={false}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest sales and QR scans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading activity...</div>
                    ) : activity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No activity yet</div>
                    ) : (
                      <div className="space-y-3">
                        {activity.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                item.type === 'sale' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                {item.type === 'sale' ? (
                                  <DollarSign className="h-5 w-5 text-green-600" />
                                ) : (
                                  <QrCode className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {item.type === 'sale' ? 'Manual Sale' : 'QR Scan'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.type === 'sale' 
                                    ? `${item.quantity} ticket${item.quantity > 1 ? 's' : ''} - €${item.amount.toFixed(2)}`
                                    : `Booking: ${item.bookingId}`
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{formatDate(item.timestamp)}</p>
                              <p>{formatTime(item.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pickups">
                <Card>
                  <CardHeader>
                    <CardTitle>My Pickup Request History</CardTitle>
                    <CardDescription>All pickup requests you've accepted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Currently Active (Accepted) */}
                        {acceptedRequests.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-3 text-blue-600">Active (En Route)</h3>
                            <div className="space-y-3">
                              {acceptedRequests.map((request: any) => (
                                <Card key={request.id} className="border-l-4 border-l-blue-500">
                                  <CardContent className="pt-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">{request.customerName}</p>
                                          <Badge className="bg-blue-500 text-xs">En Route</Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {request.groupSize} pax
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          {new Date(request.acceptedAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-gray-500" />
                                          <span className="text-gray-600">{request.pickupLocation}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Navigation className="h-3 w-3 text-gray-500" />
                                          <span className="text-gray-600">{request.destination}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Pickups (load from server) */}
                        <div>
                          <h3 className="text-sm font-medium mb-3 text-gray-600">Completed</h3>
                          {(() => {
                            const completedPickups = activity.filter((item: any) => 
                              item.type === 'pickup_completed'
                            );
                            
                            if (completedPickups.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  No completed pickups yet
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-3">
                                {completedPickups.map((item: any, index: number) => (
                                  <Card key={index} className="border-l-4 border-l-green-500">
                                    <CardContent className="pt-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <p className="font-medium">{item.customerName || 'Customer'}</p>
                                            <Badge className="bg-green-500 text-xs">Completed</Badge>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {acceptedRequests.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No active pickup requests. Accept requests from the pending list above to see them here.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Driver Info */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{driver.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{driver.phoneNumber || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium">{driver.vehicleType || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">{driver.licenseNumber || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(driver.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}