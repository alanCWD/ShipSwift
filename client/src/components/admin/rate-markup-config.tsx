import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface RateMarkup {
  id: string;
  carrierName: string;
  serviceName?: string;
  markupType: 'percentage' | 'fixed';
  markupValue: string;
  minMarkup?: string;
  maxMarkup?: string;
  isActive: boolean;
  createdAt: string;
}

export default function RateMarkupConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState<RateMarkup | null>(null);
  const [formData, setFormData] = useState({
    carrierName: '',
    serviceName: '',
    markupType: 'percentage' as 'percentage' | 'fixed',
    markupValue: '',
    minMarkup: '',
    maxMarkup: '',
  });

  const { data: markupsData, isLoading } = useQuery({
    queryKey: ['/api/admin/rate-markups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/rate-markups');
      return response.json();
    },
  });

  const createMarkupMutation = useMutation({
    mutationFn: async (markupData: any) => {
      const response = await apiRequest('POST', '/api/admin/rate-markups', markupData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rate Markup Created",
        description: "The rate markup has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create rate markup.",
        variant: "destructive",
      });
    },
  });

  const updateMarkupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/rate-markups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rate Markup Updated",
        description: "The rate markup has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
      setEditingMarkup(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update rate markup.",
        variant: "destructive",
      });
    },
  });

  const deleteMarkupMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/rate-markups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rate Markup Deleted",
        description: "The rate markup has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rate-markups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete rate markup.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      carrierName: '',
      serviceName: '',
      markupType: 'percentage',
      markupValue: '',
      minMarkup: '',
      maxMarkup: '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.carrierName || !formData.markupValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in the carrier name and markup value.",
        variant: "destructive",
      });
      return;
    }

    const markupData = {
      carrierName: formData.carrierName,
      serviceName: formData.serviceName || null,
      markupType: formData.markupType,
      markupValue: formData.markupValue,
      minMarkup: formData.minMarkup || null,
      maxMarkup: formData.maxMarkup || null,
    };

    if (editingMarkup) {
      updateMarkupMutation.mutate({ id: editingMarkup.id, data: markupData });
    } else {
      createMarkupMutation.mutate(markupData);
    }
  };

  const handleEdit = (markup: RateMarkup) => {
    setEditingMarkup(markup);
    setFormData({
      carrierName: markup.carrierName,
      serviceName: markup.serviceName || '',
      markupType: markup.markupType,
      markupValue: markup.markupValue,
      minMarkup: markup.minMarkup || '',
      maxMarkup: markup.maxMarkup || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingMarkup(null);
    resetForm();
  };

  const markups = markupsData?.markups || [];

  const canadianCarriers = [
    'Canada Post',
    'Purolator',
    'UPS',
    'FedEx',
    'DHL',
    'Canpar',
    'Loomis',
    'GLS',
    'Nationex',
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rate Markup Configuration</h2>
          <p className="text-gray-600">Manage carrier-specific rate markups and pricing rules</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Rate Markup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMarkup ? 'Edit Rate Markup' : 'Create Rate Markup'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="carrierName">Carrier Name</Label>
                <Select
                  value={formData.carrierName}
                  onValueChange={(value) => handleInputChange('carrierName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {canadianCarriers.map((carrier) => (
                      <SelectItem key={carrier} value={carrier}>
                        {carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serviceName">Service Name (Optional)</Label>
                <Input
                  id="serviceName"
                  value={formData.serviceName}
                  onChange={(e) => handleInputChange('serviceName', e.target.value)}
                  placeholder="e.g., Express, Ground, Overnight"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to apply to all services
                </p>
              </div>

              <div>
                <Label htmlFor="markupType">Markup Type</Label>
                <Select
                  value={formData.markupType}
                  onValueChange={(value) => handleInputChange('markupType', value)}
                >
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
                  Markup Value {formData.markupType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="markupValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.markupValue}
                  onChange={(e) => handleInputChange('markupValue', e.target.value)}
                  placeholder={formData.markupType === 'percentage' ? '2.5' : '5.00'}
                  required
                />
              </div>

              {formData.markupType === 'percentage' && (
                <>
                  <div>
                    <Label htmlFor="minMarkup">Minimum Markup ($)</Label>
                    <Input
                      id="minMarkup"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minMarkup}
                      onChange={(e) => handleInputChange('minMarkup', e.target.value)}
                      placeholder="1.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxMarkup">Maximum Markup ($)</Label>
                    <Input
                      id="maxMarkup"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxMarkup}
                      onChange={(e) => handleInputChange('maxMarkup', e.target.value)}
                      placeholder="50.00"
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createMarkupMutation.isPending || updateMarkupMutation.isPending}
                >
                  {editingMarkup ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Active Rate Markups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading rate markups...</p>
            </div>
          ) : markups.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rate markups configured</h3>
              <p className="text-gray-600 mb-6">
                Create your first rate markup to start customizing carrier pricing.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rate Markup
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markups.map((markup: RateMarkup) => (
                  <TableRow key={markup.id}>
                    <TableCell className="font-medium">{markup.carrierName}</TableCell>
                    <TableCell>
                      {markup.serviceName || (
                        <span className="text-gray-500 italic">All services</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {markup.markupType === 'percentage' ? 'Percentage' : 'Fixed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {markup.markupType === 'percentage' 
                        ? `${markup.markupValue}%`
                        : `$${markup.markupValue}`
                      }
                    </TableCell>
                    <TableCell>
                      {markup.markupType === 'percentage' && (markup.minMarkup || markup.maxMarkup) ? (
                        <span className="text-sm text-gray-600">
                          ${markup.minMarkup || '0'} - ${markup.maxMarkup || '∞'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={markup.isActive ? "default" : "secondary"}>
                        {markup.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(markup)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMarkupMutation.mutate(markup.id)}
                          disabled={deleteMarkupMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markup Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Percentage Markups</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Applied as a percentage of the base rate</li>
                <li>• Can set minimum and maximum limits</li>
                <li>• Example: 2.5% markup with $1 minimum</li>
                <li>• Best for proportional pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Fixed Markups</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Applied as a fixed dollar amount</li>
                <li>• Same markup regardless of base rate</li>
                <li>• Example: $5.00 markup on all shipments</li>
                <li>• Best for handling fees or flat margins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
