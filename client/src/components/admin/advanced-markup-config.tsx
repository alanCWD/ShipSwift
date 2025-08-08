import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Settings, TrendingUp, Target, Globe, Sliders } from 'lucide-react';

interface MarkupRule {
  id?: string;
  ruleName: string;
  carrierName: string;
  serviceName?: string;
  minCost?: number;
  maxCost?: number;
  minWeight?: number;
  maxWeight?: number;
  destinationProvince?: string;
  destinationCountry?: string;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  minMarkup?: number;
  maxMarkup?: number;
  priority: number;
  description?: string;
  isActive: boolean;
}

const defaultRule: MarkupRule = {
  ruleName: '',
  carrierName: '',
  markupType: 'percentage',
  markupValue: 0,
  priority: 100,
  isActive: true,
};

const carriers = [
  'Canada Post',
  'Purolator',
  'UPS',
  'FedEx',
  'DHL',
];

const provinces = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
];

const countries = [
  'CA', 'US', 'MX', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN'
];

export default function AdvancedMarkupConfig() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MarkupRule | null>(null);
  const [formData, setFormData] = useState<MarkupRule>(defaultRule);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default markup strategy settings
  const [defaultMarkupSettings, setDefaultMarkupSettings] = useState({
    defaultMarkup: '15.0',
    markupStrategy: 'percentage',
    fallbackStrategy: 'default'
  });

  const { data: markupsData, isLoading } = useQuery({
    queryKey: ['/api/admin/rate-markups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/rate-markups');
      return response.json();
    },
  });

  // Fetch existing settings for default markup
  const { data: existingSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings');
      return response.json();
    },
  });

  // Load existing default markup settings
  useEffect(() => {
    if (existingSettings) {
      const settingsMap = existingSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setDefaultMarkupSettings({
        defaultMarkup: settingsMap.DEFAULT_MARKUP || '15.0',
        markupStrategy: settingsMap.MARKUP_STRATEGY || 'percentage',
        fallbackStrategy: settingsMap.FALLBACK_STRATEGY || 'default'
      });
    }
  }, [existingSettings]);

  const createMarkupMutation = useMutation({
    mutationFn: async (ruleData: MarkupRule) => {
      const response = await apiRequest('POST', '/api/admin/rate-markups', ruleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Markup rule created successfully',
      });
    },
  });

  const updateMarkupMutation = useMutation({
    mutationFn: async (ruleData: MarkupRule) => {
      const response = await apiRequest('PUT', `/api/admin/rate-markups/${ruleData.id}`, ruleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Markup rule updated successfully',
      });
    },
  });

  const deleteMarkupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/rate-markups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      toast({
        title: 'Success',
        description: 'Markup rule deleted successfully',
      });
    },
  });

  const saveDefaultMarkupSettings = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Default Markup Settings Saved',
        description: 'Default markup strategy has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save default markup settings.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData(defaultRule);
    setEditingRule(null);
  };

  const handleEdit = (rule: MarkupRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ruleName || !formData.carrierName) {
      toast({
        title: 'Error',
        description: 'Rule name and carrier are required',
        variant: 'destructive',
      });
      return;
    }

    if (editingRule) {
      updateMarkupMutation.mutate(formData);
    } else {
      createMarkupMutation.mutate(formData);
    }
  };

  const handleSaveDefaultMarkup = () => {
    saveDefaultMarkupSettings.mutate(defaultMarkupSettings);
  };

  const formatConditions = (rule: MarkupRule) => {
    const conditions = [];
    if (rule.minCost || rule.maxCost) {
      const min = rule.minCost ? `$${rule.minCost}` : '0';
      const max = rule.maxCost ? `$${rule.maxCost}` : '∞';
      conditions.push(`Cost: ${min} - ${max}`);
    }
    if (rule.minWeight || rule.maxWeight) {
      const min = rule.minWeight ? `${rule.minWeight}kg` : '0';
      const max = rule.maxWeight ? `${rule.maxWeight}kg` : '∞';
      conditions.push(`Weight: ${min} - ${max}`);
    }
    if (rule.destinationProvince) conditions.push(`Province: ${rule.destinationProvince}`);
    if (rule.destinationCountry) conditions.push(`Country: ${rule.destinationCountry}`);
    return conditions.length > 0 ? conditions.join(', ') : 'No conditions';
  };

  const rules = markupsData?.markups || [];

  return (
    <div className="space-y-6">
      {/* Default Markup Strategy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sliders className="w-5 h-5 mr-2" />
            Default Markup Strategy
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure the base markup strategy that applies when no specific rules match
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="markupStrategy">Markup Strategy</Label>
              <Select
                value={defaultMarkupSettings.markupStrategy}
                onValueChange={(value) => setDefaultMarkupSettings({...defaultMarkupSettings, markupStrategy: value})}
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

            <div>
              <Label htmlFor="defaultMarkup">
                Default Value {defaultMarkupSettings.markupStrategy === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="defaultMarkup"
                type="number"
                step="0.1"
                min="0"
                value={defaultMarkupSettings.defaultMarkup}
                onChange={(e) => setDefaultMarkupSettings({...defaultMarkupSettings, defaultMarkup: e.target.value})}
                placeholder={defaultMarkupSettings.markupStrategy === 'percentage' ? '15.0' : '5.00'}
              />
              <p className="text-xs text-gray-500 mt-1">
                {defaultMarkupSettings.markupStrategy === 'percentage' 
                  ? 'Percentage markup (e.g., 15.0 for 15%)' 
                  : 'Fixed dollar amount (e.g., 5.00)'}
              </p>
            </div>

            <div>
              <Label htmlFor="fallbackStrategy">Fallback Strategy</Label>
              <Select
                value={defaultMarkupSettings.fallbackStrategy}
                onValueChange={(value) => setDefaultMarkupSettings({...defaultMarkupSettings, fallbackStrategy: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default markup</SelectItem>
                  <SelectItem value="none">No markup</SelectItem>
                  <SelectItem value="minimum">Minimum 5% markup</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Applied when no advanced rules match
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Markup Strategy Overview</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Percentage-based:</strong> Applies {defaultMarkupSettings.defaultMarkup}% markup to all rates</p>
              <p><strong>Fixed amount:</strong> Adds ${defaultMarkupSettings.defaultMarkup} to all rates</p>
              <p><strong>Advanced rules only:</strong> Uses only the specific rules defined below</p>
              <p><strong>Priority:</strong> Advanced rules override default strategy when conditions match</p>
            </div>
          </div>

          <Button 
            onClick={handleSaveDefaultMarkup}
            disabled={saveDefaultMarkupSettings.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saveDefaultMarkupSettings.isPending ? 'Saving...' : 'Save Default Markup Strategy'}
          </Button>
        </CardContent>
      </Card>
      {/* Advanced Rules Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Advanced Markup Rules
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create intelligent markup rules with conditional logic that override the default strategy
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Markup Rule' : 'Create New Markup Rule'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ruleName">Rule Name *</Label>
                      <Input
                        id="ruleName"
                        value={formData.ruleName}
                        onChange={(e) => setFormData({...formData, ruleName: e.target.value})}
                        placeholder="e.g., Premium Service Markup"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                        placeholder="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-lg font-semibold flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Carrier & Service Selection
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carrierName">Carrier *</Label>
                      <Select value={formData.carrierName} onValueChange={(value) => setFormData({...formData, carrierName: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {carriers.map(carrier => (
                            <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="serviceName">Service (Optional)</Label>
                      <Input
                        id="serviceName"
                        value={formData.serviceName || ''}
                        onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                        placeholder="e.g., Expedited, Express"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all services</p>
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-lg font-semibold flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Conditional Logic
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cost Range (CAD)</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Min"
                          value={formData.minCost || ''}
                          onChange={(e) => setFormData({...formData, minCost: parseFloat(e.target.value) || undefined})}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Max"
                          value={formData.maxCost || ''}
                          onChange={(e) => setFormData({...formData, maxCost: parseFloat(e.target.value) || undefined})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Weight Range (kg)</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Min"
                          value={formData.minWeight || ''}
                          onChange={(e) => setFormData({...formData, minWeight: parseFloat(e.target.value) || undefined})}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Max"
                          value={formData.maxWeight || ''}
                          onChange={(e) => setFormData({...formData, maxWeight: parseFloat(e.target.value) || undefined})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destinationProvince">Destination Province</Label>
                      <Select value={formData.destinationProvince || 'any'} onValueChange={(value) => setFormData({...formData, destinationProvince: value === 'any' ? undefined : value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Province</SelectItem>
                          {provinces.map(province => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="destinationCountry">Destination Country</Label>
                      <Select value={formData.destinationCountry || 'any'} onValueChange={(value) => setFormData({...formData, destinationCountry: value === 'any' ? undefined : value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Country</SelectItem>
                          {countries.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-lg font-semibold flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Markup Configuration
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="markupType">Markup Type *</Label>
                      <Select value={formData.markupType} onValueChange={(value) => setFormData({...formData, markupType: value as 'percentage' | 'fixed'})}>
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
                        Markup Value * {formData.markupType === 'percentage' ? '(%)' : '($)'}
                      </Label>
                      <Input
                        id="markupValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.markupValue}
                        onChange={(e) => setFormData({...formData, markupValue: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minMarkup">Minimum Markup ($)</Label>
                      <Input
                        id="minMarkup"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minMarkup || ''}
                        onChange={(e) => setFormData({...formData, minMarkup: parseFloat(e.target.value) || undefined})}
                        placeholder="No minimum"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxMarkup">Maximum Markup ($)</Label>
                      <Input
                        id="maxMarkup"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.maxMarkup || ''}
                        onChange={(e) => setFormData({...formData, maxMarkup: parseFloat(e.target.value) || undefined})}
                        placeholder="No maximum"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Optional description for this markup rule"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                    <Label>Active Rule</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMarkupMutation.isPending || updateMarkupMutation.isPending}>
                      {editingRule ? 'Update Rule' : 'Create Rule'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No markup rules configured</h3>
              <p className="text-gray-600 mb-4">
                Create your first markup rule to start applying automated pricing logic
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule: MarkupRule) => (
                <div key={rule.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-lg">{rule.ruleName}</h4>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Carrier:</strong> {rule.carrierName}</p>
                          {rule.serviceName && <p><strong>Service:</strong> {rule.serviceName}</p>}
                          <p>
                            <strong>Markup:</strong> 
                            {rule.markupType === 'percentage' ? `${rule.markupValue}%` : `$${rule.markupValue}`}
                            {rule.minMarkup && ` (min: $${rule.minMarkup})`}
                            {rule.maxMarkup && ` (max: $${rule.maxMarkup})`}
                          </p>
                        </div>
                        <div>
                          <p><strong>Conditions:</strong> {formatConditions(rule)}</p>
                          {rule.description && <p><strong>Description:</strong> {rule.description}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rule.id && deleteMarkupMutation.mutate(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}