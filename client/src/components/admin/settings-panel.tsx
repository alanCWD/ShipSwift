import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Globe, CreditCard, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SettingsPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('shiptime');

  // ShipTime Settings
  const [shiptimeSettings, setShiptimeSettings] = useState({
    environment: 'sandbox',
    username: '',
    password: '',
    defaultMarkup: '2.0',
  });

  // Stripe Settings
  const [stripeSettings, setStripeSettings] = useState({
    publishableKey: '',
    secretKey: '',
    environment: 'test',
  });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'ABLP Logistics',
    supportEmail: 'support@ablplogistics.ca',
    phoneNumber: '1-800-225-7564',
    address: '44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada',
    autoNotifications: true,
    trackingPageBranding: true,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async ({ category, settings }: { category: string; settings: any }) => {
      const promises = Object.entries(settings).map(([key, value]) => {
        return apiRequest('POST', `/api/admin/settings`, {
          key: `${category}_${key}`,
          value: value.toString(),
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveShipTimeSettings = () => {
    saveSettingsMutation.mutate({
      category: 'shiptime',
      settings: shiptimeSettings,
    });
  };

  const handleSaveStripeSettings = () => {
    saveSettingsMutation.mutate({
      category: 'stripe',
      settings: stripeSettings,
    });
  };

  const handleSaveGeneralSettings = () => {
    saveSettingsMutation.mutate({
      category: 'general',
      settings: generalSettings,
    });
  };

  const testConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await apiRequest('POST', `/api/admin/test-connection`, { service });
      return response.json();
    },
    onSuccess: (data, service) => {
      toast({
        title: "Connection Successful",
        description: `${service} connection is working properly.`,
      });
    },
    onError: (error: any, service) => {
      toast({
        title: "Connection Failed",
        description: `${service} connection failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600">Configure your ABLP Logistics platform settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shiptime">ShipTime API</TabsTrigger>
          <TabsTrigger value="stripe">Payment Processing</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="shiptime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                ShipTime API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="environment">API Environment</Label>
                    <Select 
                      value={shiptimeSettings.environment}
                      onValueChange={(value) => setShiptimeSettings(prev => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Use Sandbox for development and testing
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="username">API Username/Email</Label>
                    <Input
                      id="username"
                      type="text"
                      value={shiptimeSettings.username}
                      onChange={(e) => setShiptimeSettings(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Your ShipTime username or email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">API Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={shiptimeSettings.password}
                      onChange={(e) => setShiptimeSettings(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Your ShipTime password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultMarkup">Default Rate Markup (%)</Label>
                    <Input
                      id="defaultMarkup"
                      type="number"
                      step="0.1"
                      min="0"
                      value={shiptimeSettings.defaultMarkup}
                      onChange={(e) => setShiptimeSettings(prev => ({ ...prev, defaultMarkup: e.target.value }))}
                      placeholder="2.0"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Default percentage markup applied to shipping rates
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Sandbox credentials are required for testing</li>
                      <li>• Production credentials are needed for live shipments</li>
                      <li>• Contact ShipTime support for API access</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveShipTimeSettings}
                  disabled={saveSettingsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save ShipTime Settings'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => testConnectionMutation.mutate('shiptime')}
                  disabled={testConnectionMutation.isPending}
                >
                  Test Connection
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stripeEnvironment">Environment</Label>
                    <Select 
                      value={stripeSettings.environment}
                      onValueChange={(value) => setStripeSettings(prev => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test Mode</SelectItem>
                        <SelectItem value="live">Live Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="publishableKey">Publishable Key</Label>
                    <Input
                      id="publishableKey"
                      type="text"
                      value={stripeSettings.publishableKey}
                      onChange={(e) => setStripeSettings(prev => ({ ...prev, publishableKey: e.target.value }))}
                      placeholder="pk_test_... or pk_live_..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={stripeSettings.secretKey}
                      onChange={(e) => setStripeSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                      placeholder="sk_test_... or sk_live_..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Payment Features:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Secure credit card processing</li>
                      <li>• Canadian dollar (CAD) support</li>
                      <li>• Real-time payment verification</li>
                      <li>• Automatic receipt generation</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Create a Stripe account</li>
                      <li>Navigate to API keys in dashboard</li>
                      <li>Copy publishable and secret keys</li>
                      <li>Use test keys for development</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSaveStripeSettings}
                  disabled={saveSettingsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save Stripe Settings'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => testConnectionMutation.mutate('stripe')}
                  disabled={testConnectionMutation.isPending}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                General Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="ABLP Logistics"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="support@ablplogistics.ca"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={generalSettings.phoneNumber}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="1-800-225-7564"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={generalSettings.address}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoNotifications">Auto Notifications</Label>
                      <Switch
                        id="autoNotifications"
                        checked={generalSettings.autoNotifications}
                        onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, autoNotifications: checked }))}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Automatically send tracking updates to customers
                    </p>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="trackingPageBranding">Branded Tracking Pages</Label>
                      <Switch
                        id="trackingPageBranding"
                        checked={generalSettings.trackingPageBranding}
                        onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, trackingPageBranding: checked }))}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Enable custom branding on customer tracking pages
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveGeneralSettings}
                disabled={saveSettingsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save General Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Email Notifications</h4>
                  <p className="text-sm text-blue-700">
                    Configure automatic email notifications for shipment events and customer communications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Customer Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Shipment Created</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Shipment Picked Up</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>In Transit Updates</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Delivered</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Admin Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>New Shipments</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Payment Failures</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>API Errors</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>System Alerts</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
