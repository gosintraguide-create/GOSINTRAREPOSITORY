import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Car, 
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Ticket,
  QrCode,
  Calendar,
  Eye
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DriverManagement() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [viewingSalesDriver, setViewingSalesDriver] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phoneNumber: '',
    vehicleType: '',
    licenseNumber: '',
    status: 'active'
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast.error('Name, username, and password are required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create driver');
      }

      toast.success('Driver account created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadDrivers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create driver');
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/${editingDriver.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update driver');
      }

      toast.success('Driver profile updated');
      setEditingDriver(null);
      resetForm();
      loadDrivers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update driver');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/${driverId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete driver');
      }

      toast.success('Driver deleted successfully');
      loadDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const openEditDialog = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      username: driver.username || driver.email, // Fallback to email if old data
      password: driver.password || '', // Load existing password
      phoneNumber: driver.phoneNumber || '',
      vehicleType: driver.vehicleType || '',
      licenseNumber: driver.licenseNumber || '',
      status: driver.status
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      phoneNumber: '',
      vehicleType: '',
      licenseNumber: '',
      status: 'active'
    });
  };

  const loadDriverSales = async (driverId: string) => {
    setLoadingSales(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/${driverId}/activity`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Group sales by date
        const salesByDate: Record<string, { tickets: number; revenue: number; sales: any[] }> = {};
        
        data.sales.forEach((sale: any) => {
          const date = sale.date || sale.timestamp?.split('T')[0];
          if (!salesByDate[date]) {
            salesByDate[date] = { tickets: 0, revenue: 0, sales: [] };
          }
          salesByDate[date].tickets += parseInt(sale.quantity || 0);
          salesByDate[date].revenue += parseFloat(sale.amount || 0);
          salesByDate[date].sales.push(sale);
        });

        setSalesData({
          salesByDate,
          totalSales: data.sales.length,
          allSales: data.sales
        });
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoadingSales(false);
    }
  };

  const openSalesDialog = (driver: any) => {
    setViewingSalesDriver(driver);
    loadDriverSales(driver.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl">Driver Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage driver accounts
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97843] hover:bg-[#D97843]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Driver Account</DialogTitle>
              <DialogDescription>
                Add a new driver to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+351 932 967 279"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Input
                  id="vehicleType"
                  placeholder="Tuk Tuk"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="ABC-1234"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>

              <Button
                onClick={handleCreateDriver}
                className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
              >
                Create Driver
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Drivers</CardTitle>
            <User className="h-4 w-4 text-[#D97843]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{drivers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Drivers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {drivers.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-[#0A4D5C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {drivers.reduce((sum, d) => sum + (d.totalTicketsSold || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              €{drivers.reduce((sum, d) => sum + (d.totalRevenue || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
          <CardDescription>
            Manage driver accounts and view their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No drivers yet</p>
              <p className="text-sm mt-1">Create your first driver account to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-gray-500">
                            {driver.phoneNumber || 'No phone'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{driver.username || driver.email}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {driver.password || '••••••••'}
                        </code>
                      </TableCell>
                      <TableCell>{driver.vehicleType || '—'}</TableCell>
                      <TableCell>
                        <Badge className={
                          driver.status === 'active' 
                            ? 'bg-green-500' 
                            : 'bg-gray-500'
                        }>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.totalTicketsSold || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        €{(driver.totalRevenue || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {driver.totalQRScans || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSalesDialog(driver)}
                            className="text-[#0A4D5C] hover:bg-[#0A4D5C]/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Dialog
                            open={editingDriver?.id === driver.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingDriver(null);
                                resetForm();
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(driver)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Driver</DialogTitle>
                                <DialogDescription>
                                  Update driver information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData({ ...formData, name: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-username">Username</Label>
                                  <Input
                                    id="edit-username"
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    className="bg-gray-50 text-gray-500"
                                  />
                                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-password">Password</Label>
                                  <Input
                                    id="edit-password"
                                    type="text"
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={(e) =>
                                      setFormData({ ...formData, password: e.target.value })
                                    }
                                  />
                                  <p className="text-xs text-gray-500">Leave blank to keep current password</p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-phone">Phone Number</Label>
                                  <Input
                                    id="edit-phone"
                                    value={formData.phoneNumber}
                                    onChange={(e) =>
                                      setFormData({ ...formData, phoneNumber: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-vehicle">Vehicle Type</Label>
                                  <Input
                                    id="edit-vehicle"
                                    value={formData.vehicleType}
                                    onChange={(e) =>
                                      setFormData({ ...formData, vehicleType: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-license">License Number</Label>
                                  <Input
                                    id="edit-license"
                                    value={formData.licenseNumber}
                                    onChange={(e) =>
                                      setFormData({ ...formData, licenseNumber: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-status">Status</Label>
                                  <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                      setFormData({ ...formData, status: value })
                                    }
                                  >
                                    <SelectTrigger id="edit-status">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button
                                  onClick={handleUpdateDriver}
                                  className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                                >
                                  Update Driver
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales History Dialog */}
      <Dialog open={!!viewingSalesDriver} onOpenChange={(open) => {
        if (!open) {
          setViewingSalesDriver(null);
          setSalesData(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D97843]" />
              Sales & Revenue Log - {viewingSalesDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Daily sales history and performance metrics
            </DialogDescription>
          </DialogHeader>

          {loadingSales ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading sales data...</div>
            </div>
          ) : salesData && Object.keys(salesData.salesByDate).length > 0 ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[#0A4D5C]" />
                      Total Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesData.totalSales}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{Object.values(salesData.salesByDate).reduce((sum: number, day: any) => sum + day.revenue, 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D97843]" />
                  Daily Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(salesData.salesByDate)
                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .map(([date, data]: [string, any]) => (
                    <Card key={date} className="border-l-4 border-l-[#D97843]">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {formatDate(date)}
                          </CardTitle>
                          <div className="flex gap-4 text-sm">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              {data.tickets} tickets
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                              <DollarSign className="h-3 w-3" />
                              €{data.revenue.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {data.sales.map((sale: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="font-medium">
                                  Sale #{sale.id?.slice(-8)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(sale.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-4 items-center">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Quantity</div>
                                  <div className="font-medium">{sale.quantity}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Amount</div>
                                  <div className="font-medium text-green-600">€{parseFloat(sale.amount).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No sales recorded yet</p>
              <p className="text-sm mt-1">Sales will appear here once the driver makes their first transaction</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}