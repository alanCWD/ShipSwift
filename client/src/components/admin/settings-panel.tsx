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
import { Settings, Globe, CreditCard, Building, Shield, AlertTriangle, CheckCircle, Key, Truck, Mail, Info, Download, Upload, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import ShipTimeGuidelines from './shiptime-guidelines';

export default function SettingsPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('shiptime');
  const [testingConnection, setTestingConnection] = useState(false);
  const [initPassword, setInitPassword] = useState('');
  const [importData, setImportData] = useState('');
  const [exportedSettings, setExportedSettings] = useState<string | null>(null);

  // ShipTime API Settings
  const [shiptimeSettings, setShiptimeSettings] = useState({
    username: '',
    password: '',
    environment: 'production',
  });

  // Stripe API Settings
  const [stripeSettings, setStripeSettings] = useState({
    publishableKey: '',
    secretKey: '',
    environment: 'test',
  });

  // SendGrid API Settings
  const [sendgridSettings, setSendgridSettings] = useState({
    apiKey: '',
    fromEmail: 'noreply@ablplogistics.ca',
    fromName: 'GoABLP',
  });

  // Stallion API Settings
  const [stallionSettings, setStallionSettings] = useState({
    apiToken: '',
    environment: 'production',
  });

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    companyName: 'GoABLP',
    businessNumber: '',
    supportEmail: 'support@ablplogistics.ca',
    phoneNumber: '(604) 392-3923',
    address: '44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada',
    website: 'https://ablplogistics.ca',
    defaultShipmentEmail: 'shipping@goablp.com',
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

      setStripeSettings({
        publishableKey: settingsMap.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: settingsMap.STRIPE_SECRET_KEY || '',
        environment: settingsMap.STRIPE_ENVIRONMENT || 'test',
      });

      setSendgridSettings({
        apiKey: settingsMap.SENDGRID_API_KEY || '',
        fromEmail: settingsMap.SENDGRID_FROM_EMAIL || 'support@goablp.com',
        fromName: settingsMap.SENDGRID_FROM_NAME || 'GoABLP',
      });

      setStallionSettings({
        apiToken: settingsMap.stallion_api_token || '',
        environment: settingsMap.stallion_environment || 'production',
      });

      setCompanySettings({
        companyName: settingsMap.COMPANY_NAME || 'GoABLP',
        businessNumber: settingsMap.BUSINESS_NUMBER || '',
        supportEmail: settingsMap.SUPPORT_EMAIL || 'support@goablp.com',
        phoneNumber: settingsMap.PHONE_NUMBER || '(604) 392-3923',
        address: settingsMap.COMPANY_ADDRESS || '44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada',
        website: settingsMap.COMPANY_WEBSITE || 'https://ablplogistics.ca',
        defaultShipmentEmail: settingsMap.DEFAULT_SHIPMENT_EMAIL || 'shipping@goablp.com',
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

  const saveStripeSettings = useMutation({
    mutationFn: async (credentials: { publishableKey: string; secretKey: string; environment: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings/stripe-credentials', credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stripe Credentials Saved",
        description: "Stripe API credentials have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save Stripe credentials.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async ({ service, environment }: { service: string; environment?: string }) => {
      const response = await apiRequest('POST', `/api/admin/test-connection/${service}`, { environment });
      return response.json();
    },
    onSuccess: (data, { service }) => {
      toast({
        title: "Connection Test Successful",
        description: `${service} API connection is working properly.`,
      });
    },
    onError: (error: any, { service }) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || `Failed to connect to ${service} API.`,
        variant: "destructive",
      });
    },
  });

  const saveStallionSettings = useMutation({
    mutationFn: async (credentials: { apiToken: string; environment: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings/stallion-credentials', credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stallion Credentials Saved",
        description: "Stallion API credentials have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save Stallion credentials.",
        variant: "destructive",
      });
    },
  });

  const saveSendGridSettings = useMutation({
    mutationFn: async (credentials: { apiKey: string; fromEmail: string; fromName: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings/sendgrid-credentials', credentials);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SendGrid Credentials Saved",
        description: "Email API credentials have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save SendGrid credentials.",
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

  const handleSaveStripeSettings = () => {
    saveStripeSettings.mutate({
      publishableKey: stripeSettings.publishableKey,
      secretKey: stripeSettings.secretKey,
      environment: stripeSettings.environment,
    });
  };

  const handleSaveStallionSettings = () => {
    saveStallionSettings.mutate({
      apiToken: stallionSettings.apiToken,
      environment: stallionSettings.environment,
    });
  };

  const handleSaveSendGridSettings = () => {
    saveSendGridSettings.mutate({
      apiKey: sendgridSettings.apiKey,
      fromEmail: sendgridSettings.fromEmail,
      fromName: sendgridSettings.fromName,
    });
  };

  const handleSaveCompanySettings = () => {
    saveCompanySettings.mutate(companySettings);
  };

  const handleTestConnection = async (service: string) => {
    setTestingConnection(true);
    try {
      let environment;
      if (service === 'shiptime') {
        environment = shiptimeSettings.environment;
      } else if (service === 'stallion') {
        environment = stallionSettings.environment;
      } else if (service === 'stripe') {
        environment = stripeSettings.environment;
      }
      await testConnectionMutation.mutateAsync({ service, environment });
    } finally {
      setTestingConnection(false);
    }
  };

  // Initialize required users mutation
  const initializeUsersMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('POST', '/api/admin/initialize-required-users', { password });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Initialization Complete",
        description: `Successfully processed ${data.results.length} required users. Check the results for details.`,
      });
      console.log('User initialization results:', data.results);
    },
    onError: (error: any) => {
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize required users.",
        variant: "destructive",
      });
    },
  });

  const handleInitializeUsers = () => {
    if (!initPassword || initPassword.length < 8) {
      toast({
        title: "Password Required",
        description: "Please enter a password of at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    initializeUsersMutation.mutate(initPassword);
  };

  // Export settings mutation
  const exportSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings/export');
      return response.json();
    },
    onSuccess: (data) => {
      const exportJson = JSON.stringify(data, null, 2);
      setExportedSettings(exportJson);
      toast({
        title: "Settings Exported",
        description: `Exported ${data.settingsCount} settings. Copy the JSON below.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export settings.",
        variant: "destructive",
      });
    },
  });

  // Import settings mutation
  const importSettingsMutation = useMutation({
    mutationFn: async (settingsJson: string) => {
      const parsed = JSON.parse(settingsJson);
      const settings = parsed.settings || parsed;
      const response = await apiRequest('POST', '/api/admin/settings/import', { settings });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Settings Imported",
        description: `Successfully imported ${data.importedCount} settings.`,
      });
      setImportData('');
      // Refresh the settings
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import settings. Check JSON format.",
        variant: "destructive",
      });
    },
  });

  const handleExportSettings = () => {
    exportSettingsMutation.mutate();
  };

  const handleImportSettings = () => {
    if (!importData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste the exported settings JSON.",
        variant: "destructive",
      });
      return;
    }
    try {
      JSON.parse(importData);
      importSettingsMutation.mutate(importData);
    } catch {
      toast({
        title: "Invalid JSON",
        description: "The pasted data is not valid JSON.",
        variant: "destructive",
      });
    }
  };

  const handleCopyExport = () => {
    if (exportedSettings) {
      navigator.clipboard.writeText(exportedSettings);
      toast({
        title: "Copied",
        description: "Settings JSON copied to clipboard.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">GoABLP Platform Configuration</h2>
        </div>
        <p className="text-gray-700">
          Configure API integrations, company information, and system-wide settings. These settings are only visible to GoABLP administrators and control the entire platform operation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="shiptime">
            <Truck className="w-4 h-4 mr-2" />
            ShipTime
          </TabsTrigger>
          <TabsTrigger value="stallion">
            <Truck className="w-4 h-4 mr-2" />
            Stallion
          </TabsTrigger>
          <TabsTrigger value="guidelines">
            <Info className="w-4 h-4 mr-2" />
            Guidelines
          </TabsTrigger>
          <TabsTrigger value="stripe">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="sendgrid">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
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

        <TabsContent value="guidelines">
          <ShipTimeGuidelines />
        </TabsContent>

        <TabsContent value="stallion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Stallion Express API Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure Stallion Express API for multi-source rate comparison. Stallion provides competitive parcel rates from multiple Canadian carriers.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Multi-Source Rate Aggregation:</strong> Stallion Express provides access to additional carriers like Intelcom, FleetOptics, and WhizDelivery. Rates from both ShipTime and Stallion are automatically compared to give customers the best price.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stallionToken">Stallion API Token</Label>
                    <Input
                      id="stallionToken"
                      type="password"
                      value={stallionSettings.apiToken}
                      onChange={(e) => setStallionSettings({...stallionSettings, apiToken: e.target.value})}
                      placeholder="Your Stallion API token"
                      data-testid="input-stallion-token"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Find your API token in Stallion dashboard: Account Settings → API Token
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>API Environment</Label>
                    <Select 
                      value={stallionSettings.environment}
                      onValueChange={(value) => setStallionSettings({...stallionSettings, environment: value})}
                    >
                      <SelectTrigger data-testid="select-stallion-environment">
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
                      <p>• Environment: {stallionSettings.environment}</p>
                      <p>• Endpoint: https://ship.stallionexpress.ca/api/v4/</p>
                      <p>• Authentication: Bearer Token</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• Queries both ShipTime and Stallion APIs</p>
                      <p>• Automatically removes duplicate rates</p>
                      <p>• Shows customers the best price</p>
                      <p>• Your markup applies equally to all sources</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveStallionSettings}
                  disabled={saveStallionSettings.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-stallion-credentials"
                >
                  {saveStallionSettings.isPending ? 'Saving...' : 'Save Stallion Credentials'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTestConnection('stallion')}
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
                Configure Stripe API credentials for payment processing. These settings apply to all clients using this platform.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Client Payment Processing:</strong> Configure Stripe API keys for the current client. These keys will be used for all payment processing.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      type="text"
                      value={stripeSettings.publishableKey}
                      onChange={(e) => setStripeSettings({...stripeSettings, publishableKey: e.target.value})}
                      placeholder="pk_test_..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Safe to use on frontend (starts with pk_)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={stripeSettings.secretKey}
                      onChange={(e) => setStripeSettings({...stripeSettings, secretKey: e.target.value})}
                      placeholder="sk_test_..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Keep secret - used for server-side processing
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Environment</Label>
                    <Select 
                      value={stripeSettings.environment}
                      onValueChange={(value) => setStripeSettings({...stripeSettings, environment: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test Mode (Sandbox)</SelectItem>
                        <SelectItem value="live">Live Mode (Production)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Payment Features</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Currency: CAD (Canadian Dollar)</p>
                      <p>• Payment Methods: Card, Apple Pay, Google Pay</p>
                      <p>• 3D Secure: Enabled</p>
                      <p>• Refunds: Supported</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Getting Your Stripe Keys</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>1. Log into your Stripe Dashboard</p>
                      <p>2. Go to Developers → API Keys</p>
                      <p>3. Copy Publishable key (pk_...)</p>
                      <p>4. Reveal and copy Secret key (sk_...)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveStripeSettings}
                  disabled={saveStripeSettings.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveStripeSettings.isPending ? 'Saving...' : 'Save Stripe Credentials'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTestConnection('stripe')}
                  disabled={testingConnection}
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security:</strong> API keys are encrypted and stored securely in the database. Never share your secret key.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sendgrid">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                SendGrid Email Configuration
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure SendGrid API credentials for automated email notifications
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Email Notifications:</strong> Configure SendGrid to send shipment notifications and system emails to customers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input
                      id="sendgridApiKey"
                      type="password"
                      value={sendgridSettings.apiKey}
                      onChange={(e) => setSendgridSettings({...sendgridSettings, apiKey: e.target.value})}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your SendGrid API Key (starts with SG.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fromEmail">From Email Address</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={sendgridSettings.fromEmail}
                      onChange={(e) => setSendgridSettings({...sendgridSettings, fromEmail: e.target.value})}
                      placeholder="noreply@ablplogistics.ca"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email address for outgoing notifications
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={sendgridSettings.fromName}
                      onChange={(e) => setSendgridSettings({...sendgridSettings, fromName: e.target.value})}
                      placeholder="GoABLP"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Display name for outgoing emails
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Email Features</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Shipment creation notifications</p>
                      <p>• Status update emails</p>
                      <p>• Delivery confirmations</p>
                      <p>• Tracking information</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Getting Your SendGrid API Key</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>1. Log into your SendGrid account</p>
                      <p>2. Go to Settings → API Keys</p>
                      <p>3. Create a new API key</p>
                      <p>4. Grant "Full Access" permissions</p>
                      <p>5. Copy the generated key (SG.xxx...)</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Domain Verification</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• Verify your sender domain in SendGrid</p>
                      <p>• Add DNS records for better deliverability</p>
                      <p>• Set up SPF and DKIM authentication</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveSendGridSettings}
                  disabled={saveSendGridSettings.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveSendGridSettings.isPending ? 'Saving...' : 'Save SendGrid Credentials'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTestConnection('sendgrid')}
                  disabled={testingConnection}
                >
                  {testingConnection ? 'Testing...' : 'Test Email Sending'}
                </Button>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security:</strong> API keys are encrypted and stored securely. Never share your SendGrid API key.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                GoABLP Company Settings
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
                    <Label htmlFor="defaultShipmentEmail">Default Shipment Email</Label>
                    <Input
                      id="defaultShipmentEmail"
                      type="email"
                      value={companySettings.defaultShipmentEmail}
                      onChange={(e) => setCompanySettings({...companySettings, defaultShipmentEmail: e.target.value})}
                      placeholder="shipping@goablp.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Default email used for carrier shipments when recipient email is not provided
                    </p>
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
                      <p className="text-sm text-gray-500">Show GoABLP branding on tracking pages</p>
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

              <Separator className="my-6" />

              {/* System Maintenance Section */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">System Maintenance</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Initialize required system users and perform maintenance tasks
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="w-full">
                      <h4 className="font-medium text-yellow-800">Initialize Required Users</h4>
                      <p className="text-sm text-yellow-700 mt-1 mb-3">
                        Ensures that essential admin and test accounts exist with proper passwords. This creates accounts for alan@citywidedigital.ca, adam@ablplogistics.com, and test@example.com if they don't exist.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="init-password" className="text-sm font-medium text-yellow-800">
                            Password for Required Users
                          </Label>
                          <Input
                            id="init-password"
                            type="password"
                            value={initPassword}
                            onChange={(e) => setInitPassword(e.target.value)}
                            placeholder="Enter secure password (min 8 characters)"
                            className="mt-1"
                            data-testid="input-init-password"
                          />
                        </div>
                        <Button 
                          onClick={handleInitializeUsers}
                          disabled={initializeUsersMutation.isPending || !initPassword}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          data-testid="button-initialize-users"
                        >
                          {initializeUsersMutation.isPending ? 'Initializing...' : 'Initialize Required Users'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Settings Sync
              </CardTitle>
              <p className="text-sm text-gray-600">
                Export settings from development and import them to production. Use this to sync API credentials between environments.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Development → Production:</strong> Export settings here in development, then paste and import them in your production app's admin panel.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Download className="w-5 h-5 mr-2 text-blue-600" />
                    <h3 className="text-lg font-semibold">Export Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export all API credentials and settings from this environment.
                  </p>
                  <Button
                    onClick={handleExportSettings}
                    disabled={exportSettingsMutation.isPending}
                    className="w-full"
                    data-testid="button-export-settings"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportSettingsMutation.isPending ? 'Exporting...' : 'Export Settings'}
                  </Button>
                  
                  {exportedSettings && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Exported Settings JSON</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyExport}
                          data-testid="button-copy-export"
                        >
                          Copy
                        </Button>
                      </div>
                      <textarea
                        className="w-full h-48 font-mono text-xs p-3 border rounded-lg bg-gray-50"
                        value={exportedSettings}
                        readOnly
                        data-testid="textarea-export-result"
                      />
                    </div>
                  )}
                </div>

                {/* Import Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-green-600" />
                    <h3 className="text-lg font-semibold">Import Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Paste exported settings JSON from another environment to import them here.
                  </p>
                  <textarea
                    className="w-full h-32 font-mono text-xs p-3 border rounded-lg"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder='Paste exported settings JSON here...'
                    data-testid="textarea-import-data"
                  />
                  <Button
                    onClick={handleImportSettings}
                    disabled={importSettingsMutation.isPending || !importData.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-import-settings"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importSettingsMutation.isPending ? 'Importing...' : 'Import Settings'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">How to Sync Settings to Production</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Click "Export Settings" above to get your development settings</li>
                  <li>Click "Copy" to copy the JSON to your clipboard</li>
                  <li>Open your <strong>production</strong> app in a new browser tab</li>
                  <li>Log in as admin and go to Admin → Settings → Sync tab</li>
                  <li>Paste the JSON and click "Import Settings"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}