import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Edit, 
  Eye, 
  DollarSign, 
  TrendingUp,
  Package,
  Clock,
  Search,
  Filter,
  Calendar,
  Key,
  Activity,
  Plus,
  UserPlus,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  totalSpent: string;
  totalSaved: string;
  shipmentsCount: number;
  preferredCarrier: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserActivity {
  id: string;
  activityType: string;
  activityData: any;
  ipAddress: string | null;
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user statistics
  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/api/admin/users/stats'],
  });

  // Fetch all users with filtering
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = `/api/admin/users${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Fetch user activity for selected user
  const { data: userActivity = [] } = useQuery<UserActivity[]>({
    queryKey: ['/api/admin/users', selectedUser?.id, 'activity'],
    enabled: !!selectedUser && showActivityModal,
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const response = await fetch(`/api/admin/users/${selectedUser.id}/activity`);
      if (!response.ok) throw new Error('Failed to fetch user activity');
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setShowCreateUserModal(false);
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowUserModal(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });
      setShowPasswordResetModal(false);
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserUpdate = (updates: Partial<User>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, updates });
    }
  };

  const handleCreateUser = (userData: any) => {
    createUserMutation.mutate(userData);
  };

  const handlePasswordReset = (newPassword: string) => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ id: selectedUser.id, newPassword });
    }
  };

  const handleViewActivity = (user: User) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordResetModal(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'ablp_admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Component to display user statistics with real data
  const UserStatsCell = ({ userId, field }: { userId: string; field: 'shipments' | 'totalSpent' | 'totalSaved' }) => {
    const { data: stats, isLoading } = useQuery<{
      shipmentsCount: number;
      totalSpent: string;
      totalSaved: string;
      lastLoginAt: Date | null;
      loginCount: number;
    }>({
      queryKey: [`/api/admin/users/${userId}/stats`],
      enabled: !!userId,
    });

    if (isLoading) {
      return <div className="text-sm text-gray-400">Loading...</div>;
    }

    if (!stats) {
      return <div className="text-sm text-gray-400">--</div>;
    }

    switch (field) {
      case 'shipments':
        return (
          <div className="flex items-center text-sm">
            <Package className="w-4 h-4 mr-1 text-gray-400" />
            {stats.shipmentsCount}
          </div>
        );
      case 'totalSpent':
        return (
          <div className="flex items-center text-sm">
            <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
            ${parseFloat(stats.totalSpent).toFixed(2)}
          </div>
        );
      case 'totalSaved':
        return (
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            ${parseFloat(stats.totalSaved).toFixed(2)}
          </div>
        );
      default:
        return <div className="text-sm text-gray-400">--</div>;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users and their access levels</p>
        </div>
        <Button onClick={() => setShowCreateUserModal(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newUsersToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.averageOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ablp_admin">ABLP Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Shipments</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Total Saved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : 'N/A'
                            }
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.companyName || 'Individual'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === 'ablp_admin' ? 'ABLP Admin' : 
                           user.role === 'admin' ? 'Admin' : 'Customer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt 
                            ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy HH:mm')
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.loginCount} logins
                        </div>
                      </TableCell>
                      <TableCell>
                        <UserStatsCell userId={user.id} field="shipments" />
                      </TableCell>
                      <TableCell>
                        <UserStatsCell userId={user.id} field="totalSpent" />
                      </TableCell>
                      <TableCell>
                        <UserStatsCell userId={user.id} field="totalSaved" />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserEdit(user)}
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewActivity(user)}
                            title="View Activity"
                          >
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and access level
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <UserEditForm 
              user={selectedUser}
              onUpdate={handleUserUpdate}
              isUpdating={updateUserMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with specified role and access level
            </DialogDescription>
          </DialogHeader>
          
          <CreateUserForm 
            onCreate={handleCreateUser}
            isCreating={createUserMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* User Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Recent activity for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <UserActivityView activity={userActivity} />
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordResetModal} onOpenChange={setShowPasswordResetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <PasswordResetForm 
            onReset={handlePasswordReset}
            isResetting={resetPasswordMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Edit Form Component
function UserEditForm({ 
  user, 
  onUpdate, 
  isUpdating 
}: { 
  user: User; 
  onUpdate: (updates: Partial<User>) => void; 
  isUpdating: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    companyName: user.companyName || '',
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
    notes: user.notes || '',
  });

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      notes: user.notes || '',
    });
  }, [user]);

  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required - individual accounts are not allowed';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onUpdate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business Rule Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Business Policy:</strong> All accounts must be associated with a company. Individual personal accounts are not permitted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className={errors.companyName ? 'border-red-500' : ''}
          placeholder="Company name is required - no individual accounts allowed"
        />
        {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={errors.phone ? 'border-red-500' : ''}
          placeholder="e.g., +1 (604) 123-4567"
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ablp_admin">ABLP Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.isActive ? 'active' : 'inactive'} 
            onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Admin Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this user..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update User'}
        </Button>
      </div>
    </form>
  );
}

// Create User Form Component
function CreateUserForm({ 
  onCreate, 
  isCreating 
}: { 
  onCreate: (userData: any) => void; 
  isCreating: boolean;
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    role: 'customer',
    password: '',
    confirmPassword: '',
    isActive: true,
    notes: '',
  });

  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required - individual accounts are not allowed';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...userData } = formData;
      onCreate(userData);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password, confirmPassword: password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business Rule Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Business Policy:</strong> All accounts must be associated with a company. Individual personal accounts are not permitted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ablp_admin">ABLP Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className={errors.companyName ? 'border-red-500' : ''}
          placeholder="Company name is required - no individual accounts allowed"
        />
        {errors.companyName && <p className="text-sm text-red-500">{errors.companyName}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={errors.phone ? 'border-red-500' : ''}
          placeholder="e.g., +1 (604) 123-4567"
        />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="flex gap-2">
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? 'border-red-500' : ''}
          />
          <Button type="button" variant="outline" onClick={generatePassword}>
            Generate
          </Button>
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
      </div>

      <div>
        <Label htmlFor="notes">Admin Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this user..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">Active Account</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}

// Password Reset Form Component
function PasswordResetForm({ 
  onReset, 
  isResetting 
}: { 
  onReset: (password: string) => void; 
  isResetting: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    onReset(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">New Password</Label>
        <div className="flex gap-2">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password..."
          />
          <Button type="button" variant="outline" onClick={generatePassword}>
            Generate
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password..."
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isResetting}>
          {isResetting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
}

// User Activity View Component
function UserActivityView({ activity }: { activity: UserActivity[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'logout':
        return <UserX className="w-4 h-4 text-gray-600" />;
      case 'shipment_created':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'rate_quoted':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-green-50 border-green-200';
      case 'logout':
        return 'bg-gray-50 border-gray-200';
      case 'shipment_created':
        return 'bg-blue-50 border-blue-200';
      case 'rate_quoted':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (activity.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity recorded for this user
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activity.map((item) => (
        <div key={item.id} className={`p-4 rounded-lg border ${getActivityColor(item.activityType)}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(item.activityType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {item.activityType.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {item.activityData && (
                <div className="mt-2">
                  <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(item.activityData, null, 2)}
                  </pre>
                </div>
              )}
              {item.ipAddress && (
                <p className="text-xs text-gray-500 mt-1">
                  IP: {item.ipAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}