import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Globe, CreditCard, Building, Shield, AlertTriangle, CheckCircle, Key, Truck, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SettingsPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('shiptime');
  const [testingConnection, setTestingConnection] = useState(false);

  // ShipTime API Settings
  const [shiptimeSettings, setShiptimeSettings] = useState({
    username: '',
    password: '',
    environment: 'production',
  });

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    companyName: 'ABLP Logistics',
    businessNumber: '',
    supportEmail: 'support@ablplogistics.ca',
    phoneNumber: '(604) 392-3923',
    address: '44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada',
    website: 'https://ablplogistics.ca',
    defaultMarkup: '15.0',
    markupStrategy: 'percentage',
    autoNotifications: true,
    trackingPageBranding: true,
    allowClientBranding: true,
  });

  // Fetch existing settings
  const { data: existingSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings');
      return response.json();
    },
  });

  // Load existing settings
  useEffect(() => {
    if (existingSettings) {
      const settingsMap = existingSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setShiptimeSettings({
        username: settingsMap.SHIPTIME_USERNAME || '',
        password: settingsMap.SHIPTIME_PASSWORD || '',
        environment: settingsMap.SHIPTIME_ENVIRONMENT || 'production',
      });

      setCompanySettings({
        companyName: settingsMap.COMPANY_NAME || 'ABLP Logistics',
        businessNumber: settingsMap.BUSINESS_NUMBER || '',
        supportEmail: settingsMap.SUPPORT_EMAIL || 'support@ablplogistics.ca',
        phoneNumber: settingsMap.PHONE_NUMBER || '(604) 392-3923',
        address: settingsMap.COMPANY_ADDRESS || '44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada',
        website: settingsMap.COMPANY_WEBSITE || 'https://ablplogistics.ca',
        defaultMarkup: settingsMap.DEFAULT_MARKUP || '15.0',
        markupStrategy: settingsMap.MARKUP_STRATEGY || 'percentage',
        autoNotifications: settingsMap.AUTO_NOTIFICATIONS === 'true',
        trackingPageBranding: settingsMap.TRACKING_PAGE_BRANDING === 'true',
        allowClientBranding: settingsMap.ALLOW_CLIENT_BRANDING === 'true',
      });
    }
  }, [existingSettings]);

  const saveShipTimeSettings = useMutation({
    mutationFn: async (credentials: { username: string; password: string; environment: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings/shiptime-credentials', credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ShipTime Credentials Saved",
        description: "API credentials have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save ShipTime credentials.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiRequest('POST', `/api/admin/test-connection/${service}`);
      return response.json();
    },
    onSuccess: (data, service) => {
      toast({
        title: "Connection Test Successful",
        description: `${service} API connection is working properly.`,
      });
    },
    onError: (error: any, service) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || `Failed to connect to ${service} API.`,
        variant: "destructive",
      });
    },
  });

  const saveCompanySettings = useMutation({
    mutationFn: async (settings: any) => {
      const promises = Object.entries(settings).map(([key, value]) => {
        const settingKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        return apiRequest('POST', '/api/admin/settings', {
          key: settingKey,
          value: value?.toString() || '',
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Company Settings Saved",
        description: "Company settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save company settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveShipTimeSettings = () => {
    saveShipTimeSettings.mutate({
      username: shiptimeSettings.username,
      password: shiptimeSettings.password,
      environment: shiptimeSettings.environment,
    });
  };

  const handleSaveCompanySettings = () => {
    saveCompanySettings.mutate(companySettings);
  };

  const handleTestConnection = async (service: string) => {
    setTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync(service);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">ABLP Platform Configuration</h2>
        </div>
        <p className="text-gray-700">
          Configure API integrations, company information, and system-wide settings. These settings are only visible to ABLP administrators and control the entire platform operation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shiptime">
            <Truck className="w-4 h-4 mr-2" />
            ShipTime API
          </TabsTrigger>
          <TabsTrigger value="stripe">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Processing
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="w-4 h-4 mr-2" />
            Company Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shiptime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                ShipTime API Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure your ShipTime API credentials for shipping rate calculation and label generation
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Production Environment:</strong> Using live ShipTime API. Ensure credentials are correct to avoid service disruption.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">API Username/Email</Label>
                    <Input
                      id="username"
                      type="text"
                      value={shiptimeSettings.username}
                      onChange={(e) => setShiptimeSettings({...shiptimeSettings, username: e.target.value})}
                      placeholder="Your ShipTime username or email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">API Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={shiptimeSettings.password}
                      onChange={(e) => setShiptimeSettings({...shiptimeSettings, password: e.target.value})}
                      placeholder="Your ShipTime password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>API Environment</Label>
                    <Select 
                      value={shiptimeSettings.environment}
                      onValueChange={(value) => setShiptimeSettings({...shiptimeSettings, environment: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production (Live)</SelectItem>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">API Status</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Environment: {shiptimeSettings.environment}</p>
                      <p>• Endpoint: https://restapi.shiptime.com/rest/</p>
                      <p>• Authentication: Basic Auth</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveShipTimeSettings}
                  disabled={saveShipTimeSettings.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveShipTimeSettings.isPending ? 'Saving...' : 'Save API Credentials'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTestConnection('shiptime')}
                  disabled={testingConnection}
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Stripe Payment Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Payment processing is already configured through environment variables
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Stripe payment processing is active and working. API keys are securely stored in environment variables.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Current Configuration</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Environment: Test Mode (Sandbox)</p>
                  <p>• Supported Methods: Card, Apple Pay, Google Pay</p>
                  <p>• Currency: CAD (Canadian Dollar)</p>
                  <p>• 3D Secure: Enabled</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Production Setup</h4>
                <p className="text-sm text-blue-700">
                  To enable live payments, update the Stripe API keys in the environment variables and restart the application.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                ABLP Company Settings
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure company information and platform-wide settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessNumber">Business Number</Label>
                    <Input
                      id="businessNumber"
                      value={companySettings.businessNumber}
                      onChange={(e) => setCompanySettings({...companySettings, businessNumber: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={companySettings.supportEmail}
                      onChange={(e) => setCompanySettings({...companySettings, supportEmail: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={companySettings.phoneNumber}
                      onChange={(e) => setCompanySettings({...companySettings, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Company Address</Label>
                    <Input
                      id="address"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="defaultMarkup">Default Markup (%)</Label>
                    <Input
                      id="defaultMarkup"
                      type="number"
                      step="0.1"
                      min="0"
                      value={companySettings.defaultMarkup}
                      onChange={(e) => setCompanySettings({...companySettings, defaultMarkup: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Default markup percentage (overridden by advanced rules)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="markupStrategy">Markup Strategy</Label>
                    <Select
                      value={companySettings.markupStrategy}
                      onValueChange={(value) => setCompanySettings({...companySettings, markupStrategy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage-based</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                        <SelectItem value="advanced">Advanced rules only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Platform Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Notifications</Label>
                      <p className="text-sm text-gray-500">Send automatic email notifications for shipment updates</p>
                    </div>
                    <Switch
                      checked={companySettings.autoNotifications}
                      onCheckedChange={(checked) => setCompanySettings({...companySettings, autoNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tracking Page Branding</Label>
                      <p className="text-sm text-gray-500">Show ABLP branding on tracking pages</p>
                    </div>
                    <Switch
                      checked={companySettings.trackingPageBranding}
                      onCheckedChange={(checked) => setCompanySettings({...companySettings, trackingPageBranding: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Client Branding</Label>
                      <p className="text-sm text-gray-500">Allow clients to customize their tracking pages</p>
                    </div>
                    <Switch
                      checked={companySettings.allowClientBranding}
                      onCheckedChange={(checked) => setCompanySettings({...companySettings, allowClientBranding: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveCompanySettings}
                disabled={saveCompanySettings.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saveCompanySettings.isPending ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}