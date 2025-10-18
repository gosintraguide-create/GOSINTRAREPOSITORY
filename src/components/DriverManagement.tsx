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
  QrCode
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DriverManagement() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email, and password are required');
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
      email: driver.email,
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
      email: '',
      password: '',
      phoneNumber: '',
      vehicleType: '',
      licenseNumber: '',
      status: 'active'
    });
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@gosintra.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    <TableHead>Email</TableHead>
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
                      <TableCell>{driver.email}</TableCell>
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
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-gray-50 text-gray-500"
                                  />
                                  <p className="text-xs text-gray-500">Email cannot be changed</p>
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
    </div>
  );
}
