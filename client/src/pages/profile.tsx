import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Building, Shield, Calendar, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import PaymentMethods from '@/components/payment-methods';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    companyName: user?.companyName || '',
  });

  // Fetch fresh user data
  const { data: freshUserData } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/user');
      return response.json();
    },
  });

  useEffect(() => {
    if (freshUserData) {
      setFormData({
        firstName: freshUserData.firstName || '',
        lastName: freshUserData.lastName || '',
        email: freshUserData.email || '',
        companyName: freshUserData.companyName || '',
      });
    }
  }, [freshUserData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest('PUT', '/api/auth/profile', profileData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setUser(data.user);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg text-gray-900">
                  {user?.firstName || user?.lastName 
                    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                    : 'User'
                  }
                </h3>
                <p className="text-gray-600 text-sm">{user?.email}</p>
                <Badge className={`mt-2 ${getRoleBadgeColor(user?.role || 'customer')}`}>
                  {user?.role === 'ablp_admin' ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      ABLP Administrator
                    </>
                  ) : user?.role === 'admin' ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" />
                      Administrator
                    </>
                  ) : (
                    'Customer'
                  )}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{user?.email}</span>
                </div>
                {user?.companyName && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Company:</span>
                    <span className="ml-2 font-medium">{user?.companyName}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Member since:</span>
                  <span className="ml-2 font-medium">
                    {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Enter your company name (optional)"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          companyName: user?.companyName || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">First Name</Label>
                      <p className="mt-1 text-sm text-gray-900">{user?.firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                      <p className="mt-1 text-sm text-gray-900">{user?.lastName || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                    <p className="mt-1 text-sm text-gray-900">{user?.companyName || 'Not set'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Section */}
        <div className="mt-6">
          <PaymentMethods />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}