import { useState, useEffect } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

interface DriverDashboardProps {
  driver: any;
  token: string;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

export function DriverDashboard({ driver, token, onLogout, onNavigate }: DriverDashboardProps) {
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
        setMetrics(data.metrics);
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
      <div className="bg-[#0A4D5C] text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl">Driver Dashboard</h1>
            <p className="text-[#FFF4ED]/80 mt-1">Welcome back, {driver.name}</p>
          </div>
          <div className="flex gap-2">
            {onNavigate && (
              <Button
                onClick={() => onNavigate('qr-scanner')}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-[#D97843]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{driver.totalTicketsSold || 0}</div>
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
              <div className="text-2xl">€{(driver.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                €{todayMetrics.revenue.toFixed(2)} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">QR Scans</CardTitle>
              <QrCode className="h-4 w-4 text-[#0A4D5C]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{driver.totalQRScans || 0}</div>
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
              <div className="text-2xl">
                <Badge className="bg-green-500">{driver.status}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {driver.vehicleType || 'Not set'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Requests - Show First (Urgent) */}
        {acceptedRequests.length > 0 && (
          <Card className="mb-8 border-blue-500 border-2 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">
                  {acceptedRequests.length} Active Pickup{acceptedRequests.length > 1 ? 's' : ''} (En Route)
                </CardTitle>
              </div>
              <CardDescription className="text-blue-800">
                You've accepted these requests. Mark as complete when you arrive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {acceptedRequests.map((request: any) => (
                <Card key={request.id} className="bg-white">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{request.customerName}</p>
                          <Badge variant="outline" className="text-xs bg-blue-100">
                            {request.groupSize} pax
                          </Badge>
                          <Badge className="text-xs bg-blue-500">En Route</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{request.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-3 w-3 flex-shrink-0" />
                            <span>{request.destination}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Accepted {new Date(request.acceptedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => completePickupRequest(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Requests - Available to Accept */}
        {pendingRequests.length > 0 && (
          <Card className="mb-8 border-yellow-500 border-2 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900">
                  {pendingRequests.length} Pending Pickup Request{pendingRequests.length > 1 ? 's' : ''}
                </CardTitle>
              </div>
              <CardDescription className="text-yellow-800">
                Customers are waiting for pickup. Accept a request to let the team know you're going.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.slice(0, 3).map((request: any) => (
                <Card key={request.id} className="bg-white">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{request.customerName}</p>
                          <Badge variant="outline" className="text-xs">
                            {request.groupSize} pax
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{request.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-3 w-3 flex-shrink-0" />
                            <span>{request.destination}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Requested {new Date(request.requestTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => acceptPickupRequest(request.id)}
                        size="sm"
                        className="bg-[#0A4D5C] hover:bg-[#0A4D5C]/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingRequests.length > 3 && (
                <p className="text-sm text-yellow-800 text-center pt-2">
                  + {pendingRequests.length - 3} more request{pendingRequests.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value: any) => `€${value.toFixed(2)}`}
                        labelFormatter={formatDate}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#D97843" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tickets & Scans Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets & Scans (Last 30 Days)</CardTitle>
                  <CardDescription>Daily activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip labelFormatter={formatDate} />
                      <Bar dataKey="ticketsSold" fill="#D97843" name="Tickets Sold" />
                      <Bar dataKey="qrScans" fill="#0A4D5C" name="QR Scans" />
                    </BarChart>
                  </ResponsiveContainer>
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
      </div>
    </div>
  );
}
