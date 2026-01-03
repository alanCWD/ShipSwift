import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Plus, Edit, Trash2, Save, AlertTriangle, TestTube, Shield } from "lucide-react";

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

interface RateMarkup {
  id: string;
  carrierName: string;
  serviceName?: string;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  minMarkup?: number;
  maxMarkup?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [shiptimeUsername, setShiptimeUsername] = useState('');
  const [shiptimePassword, setShiptimePassword] = useState('');
  const [stallionApiToken, setStallionApiToken] = useState('');
  const [stallionEnvironment, setStallionEnvironment] = useState<'production' | 'sandbox'>('production');
  
  // Test Mode settings
  const [stripeEnvironment, setStripeEnvironment] = useState<'production' | 'sandbox'>('production');
  const [shiptimeEnvironment, setShiptimeEnvironment] = useState<'production' | 'sandbox'>('production');
  
  const [newMarkup, setNewMarkup] = useState<{
    carrierName: string;
    serviceName: string;
    markupType: 'percentage' | 'fixed';
    markupValue: number;
    minMarkup: number;
    maxMarkup: number;
  }>({
    carrierName: '',
    serviceName: '',
    markupType: 'percentage',
    markupValue: 0,
    minMarkup: 0,
    maxMarkup: 0,
  });

  // Check if user is admin
  if (!user || (user?.role !== 'admin' && user?.role !== 'ablp_admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch current settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
  });

  const { data: markups, isLoading: markupsLoading } = useQuery({
    queryKey: ['/api/admin/rate-markups'],
  });

  // Load current settings including test mode
  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const username = settings.find((s: SystemSetting) => s.key === 'SHIPTIME_USERNAME');
      const password = settings.find((s: SystemSetting) => s.key === 'SHIPTIME_PASSWORD');
      const stallionToken = settings.find((s: SystemSetting) => s.key === 'stallion_api_token');
      const stallionEnv = settings.find((s: SystemSetting) => s.key === 'stallion_environment');
      const stripeEnv = settings.find((s: SystemSetting) => s.key === 'STRIPE_ENVIRONMENT');
      const shiptimeEnv = settings.find((s: SystemSetting) => s.key === 'SHIPTIME_ENVIRONMENT');
      
      if (username) setShiptimeUsername(username.value || '');
      if (password) setShiptimePassword(password.value || '');
      if (stallionToken) setStallionApiToken(stallionToken.value || '');
      if (stallionEnv) setStallionEnvironment(stallionEnv.value as 'production' | 'sandbox' || 'production');
      if (stripeEnv) setStripeEnvironment(stripeEnv.value as 'production' | 'sandbox' || 'production');
      if (shiptimeEnv) setShiptimeEnvironment(shiptimeEnv.value as 'production' | 'sandbox' || 'production');
    }
  }, [settings]);

  // Save ShipTime credentials
  const saveCredentialsMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return await apiRequest('/api/admin/settings/shiptime-credentials', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "ShipTime credentials saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save credentials.",
        variant: "destructive",
      });
    },
  });

  // Save Stallion credentials
  const saveStallionCredentialsMutation = useMutation({
    mutationFn: async (data: { apiToken: string; environment: string }) => {
      return await apiRequest('/api/admin/settings/stallion-credentials', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stallion Express credentials saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Stallion credentials.",
        variant: "destructive",
      });
    },
  });

  // Save rate markup
  const saveMarkupMutation = useMutation({
    mutationFn: async (markup: typeof newMarkup) => {
      return await apiRequest('/api/admin/rate-markups', 'POST', markup);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rate markup saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      // Reset form
      setNewMarkup({
        carrierName: '',
        serviceName: '',
        markupType: 'percentage',
        markupValue: 0,
        minMarkup: 0,
        maxMarkup: 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save rate markup.",
        variant: "destructive",
      });
    },
  });

  // Delete rate markup
  const deleteMarkupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/rate-markups/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rate markup deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rate markup.",
        variant: "destructive",
      });
    },
  });

  // Save Test Mode settings
  const saveTestModeMutation = useMutation({
    mutationFn: async (data: { stripeEnvironment: string; shiptimeEnvironment: string }) => {
      return await apiRequest('/api/admin/settings/test-mode', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test mode settings saved successfully. Services will use the new environment on next request.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save test mode settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveTestMode = () => {
    saveTestModeMutation.mutate({
      stripeEnvironment,
      shiptimeEnvironment,
    });
  };

  const handleSaveCredentials = () => {
    if (!shiptimeUsername || !shiptimePassword) {
      toast({
        title: "Error",
        description: "Please provide both username and password.",
        variant: "destructive",
      });
      return;
    }
    
    saveCredentialsMutation.mutate({
      username: shiptimeUsername,
      password: shiptimePassword,
    });
  };

  const handleSaveStallionCredentials = () => {
    if (!stallionApiToken) {
      toast({
        title: "Error",
        description: "Please provide Stallion API token.",
        variant: "destructive",
      });
      return;
    }
    
    saveStallionCredentialsMutation.mutate({
      apiToken: stallionApiToken,
      environment: stallionEnvironment,
    });
  };

  const handleSaveMarkup = () => {
    if (!newMarkup.carrierName || newMarkup.markupValue <= 0) {
      toast({
        title: "Error",
        description: "Please provide carrier name and valid markup value.",
        variant: "destructive",
      });
      return;
    }
    
    saveMarkupMutation.mutate(newMarkup);
  };

  if (settingsLoading || markupsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and rate markups</p>
        </div>
      </div>

      <Tabs defaultValue="testmode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="testmode" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Mode
          </TabsTrigger>
          <TabsTrigger value="credentials">ShipTime API</TabsTrigger>
          <TabsTrigger value="stallion">Stallion API</TabsTrigger>
          <TabsTrigger value="markups">Rate Markups</TabsTrigger>
        </TabsList>

        <TabsContent value="testmode">
          <div className="space-y-6">
            {/* Current Status Banner */}
            <Alert variant={stripeEnvironment === 'sandbox' || shiptimeEnvironment === 'sandbox' ? 'default' : 'destructive'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {stripeEnvironment === 'production' && shiptimeEnvironment === 'production' 
                  ? 'Production Mode Active' 
                  : 'Test Mode Active'}
              </AlertTitle>
              <AlertDescription>
                {stripeEnvironment === 'production' && shiptimeEnvironment === 'production' 
                  ? 'Real payments and shipments are being processed. Customers will be charged.'
                  : 'One or more services are in sandbox/test mode. Use test cards for Stripe sandbox.'}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Environment Configuration
                </CardTitle>
                <CardDescription>
                  Control which environment each service uses. This allows you to test payment flows 
                  with test cards while fetching real shipping rates, or vice versa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe Environment */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Stripe Payments</Label>
                      <Badge variant={stripeEnvironment === 'sandbox' ? 'secondary' : 'destructive'}>
                        {stripeEnvironment === 'sandbox' ? 'Sandbox' : 'Production'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stripeEnvironment === 'sandbox' 
                        ? 'Test mode: Use Stripe test cards (4242 4242 4242 4242). No real charges.'
                        : 'Live mode: Real credit cards will be charged. Use for actual customers.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Sandbox</span>
                    <Switch
                      checked={stripeEnvironment === 'production'}
                      onCheckedChange={(checked) => setStripeEnvironment(checked ? 'production' : 'sandbox')}
                      data-testid="switch-stripe-environment"
                    />
                    <span className="text-sm text-muted-foreground">Production</span>
                  </div>
                </div>

                {/* ShipTime Environment */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">ShipTime Shipping</Label>
                      <Badge variant={shiptimeEnvironment === 'sandbox' ? 'secondary' : 'destructive'}>
                        {shiptimeEnvironment === 'sandbox' ? 'Sandbox' : 'Production'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {shiptimeEnvironment === 'sandbox' 
                        ? 'Test mode: Shipments will NOT be created with carriers. No real shipping.'
                        : 'Live mode: Real shipments will be created and billed to your account.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Sandbox</span>
                    <Switch
                      checked={shiptimeEnvironment === 'production'}
                      onCheckedChange={(checked) => setShiptimeEnvironment(checked ? 'production' : 'sandbox')}
                      data-testid="switch-shiptime-environment"
                    />
                    <span className="text-sm text-muted-foreground">Production</span>
                  </div>
                </div>

                {/* Safety Warning */}
                {stripeEnvironment === 'sandbox' && shiptimeEnvironment === 'production' && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Safety Block Active</AlertTitle>
                    <AlertDescription>
                      Shipment creation is blocked when Stripe is in sandbox but ShipTime is in production.
                      This prevents creating real shipments without real payment.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test Card Info */}
                {stripeEnvironment === 'sandbox' && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Stripe Test Cards</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><code className="bg-background px-1 py-0.5 rounded">4242 4242 4242 4242</code> - Successful payment</p>
                      <p><code className="bg-background px-1 py-0.5 rounded">4000 0000 0000 0002</code> - Card declined</p>
                      <p><code className="bg-background px-1 py-0.5 rounded">4000 0000 0000 3220</code> - 3D Secure required</p>
                      <p className="text-muted-foreground mt-2">Use any future expiry date and any 3-digit CVC.</p>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={handleSaveTestMode}
                  disabled={saveTestModeMutation.isPending}
                  className="w-full"
                  data-testid="button-save-test-mode"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveTestModeMutation.isPending ? 'Saving...' : 'Save Environment Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>ShipTime API Credentials</CardTitle>
              <CardDescription>
                Configure the ShipTime API credentials for your production environment.
                These credentials will be used for all shipping rate calculations and label generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">ShipTime Username/Email</Label>
                <Input
                  id="username"
                  type="email"
                  value={shiptimeUsername}
                  onChange={(e) => setShiptimeUsername(e.target.value)}
                  placeholder="your-shiptime-email@domain.com"
                  data-testid="input-shiptime-username"
                />
              </div>
              <div>
                <Label htmlFor="password">ShipTime Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={shiptimePassword}
                  onChange={(e) => setShiptimePassword(e.target.value)}
                  placeholder="Your ShipTime password"
                  data-testid="input-shiptime-password"
                />
              </div>
              <Button 
                onClick={handleSaveCredentials}
                disabled={saveCredentialsMutation.isPending}
                className="w-full"
                data-testid="button-save-shiptime-credentials"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveCredentialsMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stallion">
          <Card>
            <CardHeader>
              <CardTitle>Stallion Express API Configuration</CardTitle>
              <CardDescription>
                Configure Stallion Express API for multi-source rate comparison.
                Stallion provides competitive parcel rates from multiple Canadian carriers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stallion-token">Stallion API Token</Label>
                <Input
                  id="stallion-token"
                  type="password"
                  value={stallionApiToken}
                  onChange={(e) => setStallionApiToken(e.target.value)}
                  placeholder="Your Stallion API token from Account Settings"
                  data-testid="input-stallion-token"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Find your API token in Stallion dashboard under Account Settings → API Token
                </p>
              </div>
              <div>
                <Label htmlFor="stallion-env">Environment</Label>
                <Select value={stallionEnvironment} onValueChange={(value: 'production' | 'sandbox') => setStallionEnvironment(value)}>
                  <SelectTrigger data-testid="select-stallion-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSaveStallionCredentials}
                disabled={saveStallionCredentialsMutation.isPending}
                className="w-full"
                data-testid="button-save-stallion-credentials"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveStallionCredentialsMutation.isPending ? 'Saving...' : 'Save Stallion Credentials'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markups">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Rate Markup</CardTitle>
                <CardDescription>
                  Configure markup rules for different carriers and services.
                  These markups will be applied to the base rates from ShipTime.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select value={newMarkup.carrierName} onValueChange={(value) => 
                    setNewMarkup(prev => ({ ...prev, carrierName: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canadapost">Canada Post</SelectItem>
                      <SelectItem value="purolator">Purolator</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="service">Service (Optional)</Label>
                  <Input
                    placeholder="e.g., Ground, Express"
                    value={newMarkup.serviceName}
                    onChange={(e) => setNewMarkup(prev => ({ ...prev, serviceName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="markupType">Markup Type</Label>
                  <Select value={newMarkup.markupType} onValueChange={(value: 'percentage' | 'fixed') => 
                    setNewMarkup(prev => ({ ...prev, markupType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="markupValue">
                    Markup Value ({newMarkup.markupType === 'percentage' ? '%' : '$'})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMarkup.markupValue}
                    onChange={(e) => setNewMarkup(prev => ({ ...prev, markupValue: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="minMarkup">Min Markup ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMarkup.minMarkup}
                    onChange={(e) => setNewMarkup(prev => ({ ...prev, minMarkup: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxMarkup">Max Markup ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMarkup.maxMarkup}
                    onChange={(e) => setNewMarkup(prev => ({ ...prev, maxMarkup: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <Button 
                    onClick={handleSaveMarkup}
                    disabled={saveMarkupMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {saveMarkupMutation.isPending ? 'Adding...' : 'Add Markup Rule'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Rate Markups</CardTitle>
                <CardDescription>
                  Manage existing markup rules for carriers and services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {markups && Array.isArray(markups) && markups.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Min/Max</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(markups as RateMarkup[]).map((markup: RateMarkup) => (
                        <TableRow key={markup.id}>
                          <TableCell className="font-medium">{markup.carrierName}</TableCell>
                          <TableCell>{markup.serviceName || 'All Services'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {markup.markupType === 'percentage' ? 'Percentage' : 'Fixed'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {markup.markupType === 'percentage' 
                              ? `${markup.markupValue}%` 
                              : `$${markup.markupValue.toFixed(2)}`
                            }
                          </TableCell>
                          <TableCell>
                            {markup.minMarkup || markup.maxMarkup ? (
                              <span className="text-sm text-muted-foreground">
                                ${markup.minMarkup?.toFixed(2) || '0'} - ${markup.maxMarkup?.toFixed(2) || '∞'}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No limits</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={markup.isActive ? "default" : "secondary"}>
                              {markup.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMarkupMutation.mutate(markup.id)}
                              disabled={deleteMarkupMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No rate markups configured yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}