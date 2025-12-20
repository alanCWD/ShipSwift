import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Users, Link2, Save, Loader2, Cannabis, ShieldCheck, ShieldX, RefreshCw } from "lucide-react";

interface BlazeSettings {
  id?: string;
  partnerApiKey: string;
  partnerApiSecret: string;
  excludedCarriers: string[];
  allowedShipmentTypes: string[];
  isActive: boolean;
}

interface BlazeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  blazeAccess: boolean;
}

interface BlazeConnection {
  id: string;
  userId: string;
  dispensaryName: string;
  dispensaryId: string;
  isActive: boolean;
  syncStatus: string;
  totalOrders: number;
  totalShipments: number;
  createdAt: string;
}

const ALL_CARRIERS = [
  { name: 'UPS', country: 'US', restricted: true },
  { name: 'FedEx', country: 'US', restricted: true },
  { name: 'DHL', country: 'DE', restricted: true },
  { name: 'Canada Post', country: 'CA', restricted: false },
  { name: 'Purolator', country: 'CA', restricted: false },
  { name: 'Canpar', country: 'CA', restricted: false },
  { name: 'GLS', country: 'CA', restricted: false },
  { name: 'Loomis', country: 'CA', restricted: false },
  { name: 'Intelcom', country: 'CA', restricted: false },
  { name: 'ICS', country: 'CA', restricted: false },
  { name: 'Fleet Optics', country: 'CA', restricted: false },
];

export default function BlazeSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [partnerApiKey, setPartnerApiKey] = useState('');
  const [partnerApiSecret, setPartnerApiSecret] = useState('');
  const [excludedCarriers, setExcludedCarriers] = useState<string[]>(['UPS', 'FedEx', 'DHL']);
  const [isActive, setIsActive] = useState(false);

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

  const { data: settings, isLoading: settingsLoading } = useQuery<BlazeSettings>({
    queryKey: ['/api/admin/blaze/settings'],
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ blazeUsers: BlazeUser[], allUsers: BlazeUser[] }>({
    queryKey: ['/api/admin/blaze/users'],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<BlazeConnection[]>({
    queryKey: ['/api/admin/blaze/connections'],
  });

  useEffect(() => {
    if (settings) {
      setPartnerApiKey(settings.partnerApiKey || '');
      setPartnerApiSecret(settings.partnerApiSecret || '');
      setExcludedCarriers(settings.excludedCarriers || ['UPS', 'FedEx', 'DHL']);
      setIsActive(settings.isActive || false);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<BlazeSettings>) => {
      return await apiRequest('/api/admin/blaze/settings', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blaze settings saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blaze/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Blaze settings.",
        variant: "destructive",
      });
    },
  });

  const updateUserAccessMutation = useMutation({
    mutationFn: async ({ userId, hasAccess }: { userId: string; hasAccess: boolean }) => {
      return await apiRequest(`/api/admin/blaze/users/${userId}/access`, 'POST', { hasAccess });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User access updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blaze/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user access.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      partnerApiKey,
      partnerApiSecret,
      excludedCarriers,
      isActive,
      allowedShipmentTypes: ['package', 'envelope'],
    });
  };

  const toggleCarrierExclusion = (carrierName: string) => {
    setExcludedCarriers(prev => 
      prev.includes(carrierName)
        ? prev.filter(c => c !== carrierName)
        : [...prev, carrierName]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Cannabis className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Blaze Portal Settings</h1>
          <p className="text-muted-foreground">Configure the Blaze cannabis dispensary integration</p>
        </div>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="carriers" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Carrier Restrictions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Access
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Blaze Partner API Configuration</CardTitle>
              <CardDescription>
                Enter your Blaze Partner Network credentials. These are required to integrate with Blaze dispensaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Blaze Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users with Blaze access can use the Blaze Portal
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  data-testid="switch-blaze-active"
                />
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partnerApiKey">Partner API Key</Label>
                  <Input
                    id="partnerApiKey"
                    type="password"
                    placeholder="Enter Blaze Partner API Key"
                    value={partnerApiKey}
                    onChange={(e) => setPartnerApiKey(e.target.value)}
                    data-testid="input-partner-api-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtain from Blaze Partner Network dashboard
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerApiSecret">Partner API Secret</Label>
                  <Input
                    id="partnerApiSecret"
                    type="password"
                    placeholder="Enter Blaze Partner API Secret"
                    value={partnerApiSecret}
                    onChange={(e) => setPartnerApiSecret(e.target.value)}
                    data-testid="input-partner-api-secret"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
                data-testid="button-save-blaze-settings"
              >
                {saveSettingsMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save API Settings</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Restrictions for Cannabis Shipments</CardTitle>
              <CardDescription>
                Select which carriers to exclude from Blaze shipments. US-based carriers typically have 
                policies against cannabis products and are excluded by default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  {ALL_CARRIERS.map((carrier) => (
                    <div 
                      key={carrier.name}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        excludedCarriers.includes(carrier.name) 
                          ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' 
                          : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`carrier-${carrier.name}`}
                          checked={!excludedCarriers.includes(carrier.name)}
                          onCheckedChange={() => toggleCarrierExclusion(carrier.name)}
                          data-testid={`checkbox-carrier-${carrier.name.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <div>
                          <Label htmlFor={`carrier-${carrier.name}`} className="font-medium cursor-pointer">
                            {carrier.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {carrier.country === 'CA' ? '🇨🇦 Canadian' : carrier.country === 'US' ? '🇺🇸 US-based' : '🇩🇪 International'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {carrier.restricted && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Restricted
                          </Badge>
                        )}
                        {excludedCarriers.includes(carrier.name) ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <ShieldX className="h-3 w-3" />
                            Excluded
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Allowed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="w-full"
                    data-testid="button-save-carrier-settings"
                  >
                    {saveSettingsMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Carrier Settings</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Blaze Portal User Access</CardTitle>
              <CardDescription>
                Grant or revoke access to the Blaze Portal for specific users. Only users with access 
                can create cannabis shipments through the Blaze integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Blaze Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.allUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.companyName || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-center">
                          {user.blazeAccess ? (
                            <Badge variant="default" className="bg-green-600">
                              <Cannabis className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={user.blazeAccess ? "destructive" : "default"}
                            size="sm"
                            onClick={() => updateUserAccessMutation.mutate({ 
                              userId: user.id, 
                              hasAccess: !user.blazeAccess 
                            })}
                            disabled={updateUserAccessMutation.isPending}
                            data-testid={`button-toggle-access-${user.id}`}
                          >
                            {user.blazeAccess ? 'Revoke' : 'Grant'} Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!usersData?.allUsers || usersData.allUsers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Connected Dispensaries</CardTitle>
              <CardDescription>
                View all Blaze dispensary connections across all users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispensary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-center">Shipments</TableHead>
                      <TableHead>Connected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections?.map((connection) => (
                      <TableRow key={connection.id}>
                        <TableCell className="font-medium">{connection.dispensaryName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            connection.syncStatus === 'connected' ? 'default' :
                            connection.syncStatus === 'error' ? 'destructive' : 'secondary'
                          }>
                            {connection.syncStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{connection.totalOrders}</TableCell>
                        <TableCell className="text-center">{connection.totalShipments}</TableCell>
                        <TableCell>
                          {new Date(connection.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!connections || connections.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No dispensary connections yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
