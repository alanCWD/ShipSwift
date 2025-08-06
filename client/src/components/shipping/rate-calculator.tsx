import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface RateCalculatorProps {
  onRatesReceived: (rates: any[]) => void;
}

export default function RateCalculator({ onRatesReceived }: RateCalculatorProps) {
  const [formData, setFormData] = useState({
    fromCountry: 'CA',
    fromPostalCode: 'V2R 4H1',
    toCountry: 'CA',
    toPostalCode: '',
    length: '30',
    width: '20',
    height: '15',
    weight: '2.5',
  });
  
  const [hasRates, setHasRates] = useState(false);

  const { toast } = useToast();

  const ratesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/shipping/rates', {
        fromCountry: data.fromCountry,
        fromPostalCode: data.fromPostalCode,
        toCountry: data.toCountry,
        toPostalCode: data.toPostalCode,
        packageDetails: {
          length: parseFloat(data.length),
          width: parseFloat(data.width),
          height: parseFloat(data.height),
          weight: parseFloat(data.weight),
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      onRatesReceived(data.rates);
      setHasRates(true);
      toast({
        title: "Rates Retrieved",
        description: `Found ${data.rates.length} available shipping options.`,
      });
    },
    onError: (error: any) => {
      let title = "Rate Calculation Failed";
      let description = "Unable to get shipping rates. Please try again.";
      
      if (error.message.includes('503')) {
        title = "Service Temporarily Unavailable";
        description = "The shipping service is currently unavailable. Please contact support or try again later.";
      } else if (error.message.includes('authentication')) {
        title = "Service Configuration Issue";
        description = "There's a configuration issue with the shipping service. Please contact support.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasRates(false); // Reset rates when form data changes
  };

  // Auto-fetch rates when all required fields are filled
  const autoFetchRates = useCallback(() => {
    const {
      fromPostalCode,
      toPostalCode,
      length,
      width,
      height,
      weight
    } = formData;
    
    // Check if all required fields have valid values
    const hasValidPostalCodes = fromPostalCode.trim().length >= 3 && toPostalCode.trim().length >= 3;
    const hasValidDimensions = 
      parseFloat(length) > 0 && 
      parseFloat(width) > 0 && 
      parseFloat(height) > 0 && 
      parseFloat(weight) > 0;
    
    if (hasValidPostalCodes && hasValidDimensions && !ratesMutation.isPending && !hasRates) {
      ratesMutation.mutate(formData);
    }
  }, [formData, ratesMutation, hasRates]);

  // Debounced auto-fetch effect
  useEffect(() => {
    const timer = setTimeout(() => {
      autoFetchRates();
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [autoFetchRates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromPostalCode || !formData.toPostalCode) {
      toast({
        title: "Missing Information",
        description: "Please enter both origin and destination postal codes.",
        variant: "destructive",
      });
      return;
    }

    ratesMutation.mutate(formData);
  };

  return (
    <Card className="bg-gray-50 border-none">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* From Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Ship From
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fromCountry">Country</Label>
                  <Select 
                    value={formData.fromCountry}
                    onValueChange={(value) => handleInputChange('fromCountry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fromPostalCode">Postal Code</Label>
                  <Input
                    id="fromPostalCode"
                    placeholder="e.g., V2R 4H1"
                    value={formData.fromPostalCode}
                    onChange={(e) => handleInputChange('fromPostalCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* To Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Ship To
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="toCountry">Country</Label>
                  <Select 
                    value={formData.toCountry}
                    onValueChange={(value) => handleInputChange('toCountry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toPostalCode">Postal Code</Label>
                  <Input
                    id="toPostalCode"
                    placeholder="e.g., M5H 3M7"
                    value={formData.toPostalCode}
                    onChange={(e) => handleInputChange('toPostalCode', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Package Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {ratesMutation.isPending && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mr-3" />
                <span className="text-gray-600">Auto-fetching rates...</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 text-white hover:bg-blue-700 text-lg py-4"
              disabled={ratesMutation.isPending}
            >
              {ratesMutation.isPending ? 'Comparing Rates...' : 'Refresh Shipping Rates'}
            </Button>
            
            <p className="text-sm text-gray-500 text-center">
              Rates are automatically updated when you enter package details
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
