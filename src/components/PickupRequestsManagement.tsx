import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone,
  AlertCircle,
  Car,
  Navigation
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Alert, AlertDescription } from './ui/alert';

interface PickupRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  groupSize: number;
  requestTime: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  assignedDriver?: string;
  assignedDriverName?: string;
  completedTime?: string;
  estimatedWait?: number;
}

export function PickupRequestsManagement() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('pending');

  useEffect(() => {
    loadRequests();
    // Refresh every 15 seconds
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
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

      const text = await response.text();
      if (!text) {
        console.error('Empty response from server');
        return;
      }

      try {
        const data = JSON.parse(text);
        if (data.success) {
          setRequests(data.requests);
        } else {
          console.error('Server returned unsuccessful response:', data);
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', text);
      }
    } catch (error) {
      console.error('Error loading pickup requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests/${requestId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        loadRequests();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const assignedCount = requests.filter(r => r.status === 'assigned').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getVehicleType = (size: number) => {
    if (size <= 2) return 'Tuk Tuk';
    if (size <= 4) return 'UMM Jeep';
    if (size <= 6) return 'Premium Van';
    return `${Math.ceil(size / 6)} Vehicles`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pickup requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={pendingCount > 0 ? 'border-yellow-500 border-2' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-8 w-8 ${pendingCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <span className="text-3xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">{assignedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">
                {requests.filter(r => {
                  if (r.status !== 'completed' || !r.completedTime) return false;
                  const today = new Date().toISOString().split('T')[0];
                  const completedDate = r.completedTime.split('T')[0];
                  return today === completedDate;
                }).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Navigation className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{requests.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </Button>
        <Button
          variant={filter === 'assigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('assigned')}
        >
          Assigned {assignedCount > 0 && `(${assignedCount})`}
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Alert for pending requests */}
      {pendingCount > 0 && filter === 'pending' && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You have {pendingCount} pending pickup request{pendingCount > 1 ? 's' : ''} waiting for driver assignment.
          </AlertDescription>
        </Alert>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No pickup requests yet'
                  : `No ${filter} pickup requests`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className={request.status === 'pending' ? 'border-l-4 border-l-yellow-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {request.customerName}
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(request.requestTime).toLocaleString()}
                      {request.estimatedWait && request.status === 'pending' && (
                        <span className="text-yellow-600 font-medium">
                          • Est. wait: {request.estimatedWait} min
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {request.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelRequest(request.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Pickup Location</p>
                        <p className="text-sm text-muted-foreground">{request.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Destination</p>
                        <p className="text-sm text-muted-foreground">{request.destination}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Group Size</p>
                        <p className="text-sm text-muted-foreground">
                          {request.groupSize} passenger{request.groupSize > 1 ? 's' : ''} • {getVehicleType(request.groupSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">{request.customerPhone}</p>
                      </div>
                    </div>
                    {request.assignedDriverName && (
                      <div className="flex items-start gap-2">
                        <Car className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Assigned Driver</p>
                          <p className="text-sm text-muted-foreground">{request.assignedDriverName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
