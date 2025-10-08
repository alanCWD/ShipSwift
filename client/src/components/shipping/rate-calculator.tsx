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
  const [shipmentType, setShipmentType] = useState<'package' | 'pallet'>('package');
  const [formData, setFormData] = useState({
    fromCountry: 'CA',
    fromPostalCode: 'V2R 4H1',
    toCountry: 'CA',
    toPostalCode: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    // Pallet-specific fields
    palletCount: '1',
    palletType: 'standard',
    isStackable: 'yes',
    freightClass: '',
  });
  
  const [hasRates, setHasRates] = useState(false);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric'); // cm/kg or in/lbs

  const { toast } = useToast();

  // Unit conversion functions
  const convertToMetric = (value: string, fromUnit: 'length' | 'weight') => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    if (fromUnit === 'length') {
      // Convert inches to cm
      return (num * 2.54).toFixed(1);
    } else {
      // Convert lbs to kg
      return (num / 2.205).toFixed(1);
    }
  };

  const convertToImperial = (value: string, toUnit: 'length' | 'weight') => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    if (toUnit === 'length') {
      // Convert cm to inches
      return (num / 2.54).toFixed(1);
    } else {
      // Convert kg to lbs
      return (num * 2.205).toFixed(1);
    }
  };

  const handleUnitChange = (newUnits: 'metric' | 'imperial') => {
    if (newUnits === units) return; // No change needed
    
    setUnits(newUnits);
    setHasRates(false); // Reset rates when units change
    
    // Convert existing values
    setFormData(prev => {
      const newData = { ...prev };
      
      if (newUnits === 'imperial') {
        // Converting from metric to imperial
        newData.length = convertToImperial(prev.length, 'length');
        newData.width = convertToImperial(prev.width, 'length');
        newData.height = convertToImperial(prev.height, 'length');
        newData.weight = convertToImperial(prev.weight, 'weight');
      } else {
        // Converting from imperial to metric
        newData.length = convertToMetric(prev.length, 'length');
        newData.width = convertToMetric(prev.width, 'length');
        newData.height = convertToMetric(prev.height, 'length');
        newData.weight = convertToMetric(prev.weight, 'weight');
      }
      
      return newData;
    });
  };

  const ratesMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert to metric units for API (if needed)
      let apiLength = parseFloat(data.length);
      let apiWidth = parseFloat(data.width);
      let apiHeight = parseFloat(data.height);
      let apiWeight = parseFloat(data.weight);
      
      if (units === 'imperial') {
        // Convert from imperial to metric for API
        apiLength = parseFloat(convertToMetric(data.length, 'length'));
        apiWidth = parseFloat(convertToMetric(data.width, 'length'));
        apiHeight = parseFloat(convertToMetric(data.height, 'length'));
        apiWeight = parseFloat(convertToMetric(data.weight, 'weight'));
      }
      
      const packageDetails: any = {
        length: apiLength,
        width: apiWidth,
        height: apiHeight,
        weight: apiWeight,
      };
      
      // Add pallet-specific fields if shipment type is pallet
      if (shipmentType === 'pallet') {
        packageDetails.palletCount = parseInt(data.palletCount);
        packageDetails.palletType = data.palletType;
        packageDetails.isStackable = data.isStackable === 'yes';
        if (data.freightClass) {
          packageDetails.freightClass = data.freightClass;
        }
      }
      
      const response = await apiRequest('POST', '/api/shipping/rates', {
        fromCountry: data.fromCountry,
        fromPostalCode: data.fromPostalCode,
        toCountry: data.toCountry,
        toPostalCode: data.toPostalCode,
        shipmentType,
        packageDetails
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

          {/* Shipment Type Selector */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <Label htmlFor="shipmentType">Shipment Type</Label>
              <Select 
                value={shipmentType}
                onValueChange={(value: 'package' | 'pallet') => {
                  setShipmentType(value);
                  setHasRates(false);
                }}
              >
                <SelectTrigger data-testid="select-shipment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="package" data-testid="option-package">📦 Package / Parcel</SelectItem>
                  <SelectItem value="pallet" data-testid="option-pallet">🚛 Pallet / Freight (LTL)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {shipmentType === 'package' 
                  ? 'For small to medium parcels shipped via courier services'
                  : 'For large shipments on pallets via freight carriers'}
              </p>
            </div>
          </div>

          {/* Package/Pallet Details */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                {shipmentType === 'package' ? 'Package Details' : 'Pallet Details'}
              </h3>
              
              {/* Unit Selector */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-gray-600">Units:</Label>
                <Select value={units} onValueChange={handleUnitChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">cm / kg</SelectItem>
                    <SelectItem value="imperial">in / lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">
                  Length ({units === 'metric' ? 'cm' : 'in'})
                </Label>
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
                <Label htmlFor="width">
                  Width ({units === 'metric' ? 'cm' : 'in'})
                </Label>
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
                <Label htmlFor="height">
                  Height ({units === 'metric' ? 'cm' : 'in'})
                </Label>
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
                <Label htmlFor="weight">
                  Weight ({units === 'metric' ? 'kg' : 'lbs'})
                </Label>
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
            
            {/* Pallet-Specific Fields */}
            {shipmentType === 'pallet' && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-md font-medium text-gray-900 mb-4">Additional Pallet Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="palletCount">Number of Pallets</Label>
                    <Input
                      id="palletCount"
                      data-testid="input-pallet-count"
                      type="number"
                      min="1"
                      value={formData.palletCount}
                      onChange={(e) => handleInputChange('palletCount', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="palletType">Pallet Type</Label>
                    <Select 
                      value={formData.palletType}
                      onValueChange={(value) => handleInputChange('palletType', value)}
                    >
                      <SelectTrigger data-testid="select-pallet-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (48" x 40")</SelectItem>
                        <SelectItem value="euro">Euro (47.2" x 39.4")</SelectItem>
                        <SelectItem value="custom">Custom Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="isStackable">Stackable?</Label>
                    <Select 
                      value={formData.isStackable}
                      onValueChange={(value) => handleInputChange('isStackable', value)}
                    >
                      <SelectTrigger data-testid="select-stackable">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="freightClass">Freight Class (Optional)</Label>
                  <Input
                    id="freightClass"
                    data-testid="input-freight-class"
                    placeholder="e.g., 50, 60, 70, 85, 100, 125, 150"
                    value={formData.freightClass}
                    onChange={(e) => handleInputChange('freightClass', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank if unknown. Freight class helps determine accurate pricing for LTL shipments.
                  </p>
                </div>
              </div>
            )}
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
              {ratesMutation.isPending ? 'Comparing Rates...' : 'Fetch Shipping Rates'}
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
