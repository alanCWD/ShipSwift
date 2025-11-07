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
  const [shipmentType, setShipmentType] = useState<'package' | 'envelope' | 'pallet'>('package');
  const [envelopeSize, setEnvelopeSize] = useState<string>('letter');
  const [formData, setFormData] = useState({
    fromCountry: 'CA',
    fromPostalCode: 'V2R 4H1',
    toCountry: 'CA',
    toPostalCode: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    // Pallet-specific address fields (required for freight)
    fromCompany: 'ABLP Logistics',
    fromStreet: '44322 Yale Rd #3',
    fromCity: 'Chilliwack',
    fromProvince: 'BC',
    fromPhone: '1-800-225-7564',
    fromAttention: '',
    toCompany: '',
    toStreet: '',
    toCity: '',
    toProvince: '',
    toPhone: '',
    toAttention: '',
    // Pallet-specific shipment fields
    palletCount: '1',
    palletType: 'standard',
    isStackable: 'yes',
    freightClass: '',
    // LTL accessorial services
    fromResidential: 'no',
    toResidential: 'no',
    fromTailgate: 'no',
    toTailgate: 'no',
  });
  
  const [hasRates, setHasRates] = useState(false);
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial'); // cm/kg or in/lbs

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
      // Envelope weight validation (max 2 lbs)
      if (shipmentType === 'envelope') {
        const weightInLbs = parseFloat(data.weight);
        if (weightInLbs > 2) {
          throw new Error('Envelope shipments must be 2 lbs or less');
        }
      }
      
      // Map envelope sizes to dimensions (in cm)
      const envelopeDimensions: { [key: string]: { length: number; width: number; height: number } } = {
        letter: { length: 21.6, width: 27.9, height: 1 },    // 8.5" × 11"
        legal: { length: 21.6, width: 35.6, height: 1 },     // 8.5" × 14"
        large: { length: 22.9, width: 30.5, height: 1 },     // 9" × 12"
        flat: { length: 24.1, width: 31.8, height: 1 },      // 9.5" × 12.5"
      };
      
      let apiLength: number;
      let apiWidth: number;
      let apiHeight: number;
      let apiWeight: number;
      
      if (shipmentType === 'envelope') {
        // Use pre-defined dimensions from envelope size
        const dimensions = envelopeDimensions[envelopeSize];
        apiLength = dimensions.length;
        apiWidth = dimensions.width;
        apiHeight = dimensions.height;
        // Convert weight to kg (envelopes always in lbs in UI)
        apiWeight = parseFloat(data.weight) * 0.453592;
      } else {
        // Package or pallet - use user-provided dimensions
        apiLength = parseFloat(data.length);
        apiWidth = parseFloat(data.width);
        apiHeight = parseFloat(data.height);
        apiWeight = parseFloat(data.weight);
        
        if (units === 'imperial') {
          // Convert from imperial to metric for API
          apiLength = parseFloat(convertToMetric(data.length, 'length'));
          apiWidth = parseFloat(convertToMetric(data.width, 'length'));
          apiHeight = parseFloat(convertToMetric(data.height, 'length'));
          apiWeight = parseFloat(convertToMetric(data.weight, 'weight'));
        }
      }
      
      const packageDetails: any = {
        length: apiLength,
        width: apiWidth,
        height: apiHeight,
        weight: apiWeight,
      };
      
      // Add envelope size for reference
      if (shipmentType === 'envelope') {
        packageDetails.envelopeSize = envelopeSize;
      }
      
      // Add pallet-specific fields if shipment type is pallet
      if (shipmentType === 'pallet') {
        packageDetails.palletCount = parseInt(data.palletCount);
        packageDetails.palletType = data.palletType;
        packageDetails.isStackable = data.isStackable === 'yes';
        if (data.freightClass) {
          packageDetails.freightClass = data.freightClass;
        }
        // LTL accessorial services
        packageDetails.fromResidential = data.fromResidential === 'yes';
        packageDetails.toResidential = data.toResidential === 'yes';
        packageDetails.fromTailgate = data.fromTailgate === 'yes';
        packageDetails.toTailgate = data.toTailgate === 'yes';
      }
      
      const requestBody: any = {
        fromCountry: data.fromCountry,
        fromPostalCode: data.fromPostalCode,
        toCountry: data.toCountry,
        toPostalCode: data.toPostalCode,
        shipmentType,
        packageDetails
      };

      // Add full address details for pallet shipments (required by ShipTime)
      if (shipmentType === 'pallet') {
        requestBody.fromAddress = {
          company: data.fromCompany,
          streetAddress: data.fromStreet,
          city: data.fromCity,
          state: data.fromProvince,
          phone: data.fromPhone,
          attention: data.fromAttention || data.fromCompany
        };
        requestBody.toAddress = {
          company: data.toCompany,
          streetAddress: data.toStreet,
          city: data.toCity,
          state: data.toProvince,
          phone: data.toPhone,
          attention: data.toAttention || data.toCompany
        };
      }

      const response = await apiRequest('POST', '/api/shipping/rates', requestBody);
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

  const formatPostalCode = (value: string): string => {
    // Remove spaces and convert to uppercase
    let formatted = value.replace(/\s/g, '').toUpperCase();
    
    // Add space after 3rd character for Canadian postal codes (A1A 1A1 format)
    if (formatted.length > 3) {
      formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3);
    }
    
    // Limit to 7 characters (A1A 1A1)
    return formatted.slice(0, 7);
  };

  const handleInputChange = (name: string, value: string) => {
    // Auto-format postal codes
    if (name === 'fromPostalCode' || name === 'toPostalCode') {
      value = formatPostalCode(value);
    }
    
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
      weight,
      fromCompany,
      fromStreet,
      fromCity,
      fromProvince,
      fromPhone,
      toCompany,
      toStreet,
      toCity,
      toProvince,
      toPhone
    } = formData;
    
    // Check if all required fields have valid values
    const hasValidPostalCodes = fromPostalCode.trim().length >= 3 && toPostalCode.trim().length >= 3;
    const hasValidDimensions = 
      parseFloat(length) > 0 && 
      parseFloat(width) > 0 && 
      parseFloat(height) > 0 && 
      parseFloat(weight) > 0;
    
    // For pallet shipments, require full addresses
    const hasValidPalletAddresses = shipmentType !== 'pallet' || (
      fromCompany.trim().length > 0 &&
      fromStreet.trim().length > 0 &&
      fromCity.trim().length > 0 &&
      fromProvince.trim().length > 0 &&
      fromPhone.trim().length > 0 &&
      toCompany.trim().length > 0 &&
      toStreet.trim().length > 0 &&
      toCity.trim().length > 0 &&
      toProvince.trim().length > 0 &&
      toPhone.trim().length > 0
    );
    
    if (hasValidPostalCodes && hasValidDimensions && hasValidPalletAddresses && !ratesMutation.isPending && !hasRates) {
      ratesMutation.mutate(formData);
    }
  }, [formData, ratesMutation, hasRates, shipmentType]);

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
                {shipmentType === 'pallet' && (
                  <>
                    <div>
                      <Label htmlFor="fromCompany">Company Name *</Label>
                      <Input
                        id="fromCompany"
                        placeholder="e.g., ABLP Logistics"
                        value={formData.fromCompany}
                        onChange={(e) => handleInputChange('fromCompany', e.target.value)}
                        required
                        data-testid="input-from-company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromStreet">Street Address *</Label>
                      <Input
                        id="fromStreet"
                        placeholder="e.g., 44322 Yale Rd #3"
                        value={formData.fromStreet}
                        onChange={(e) => handleInputChange('fromStreet', e.target.value)}
                        required
                        data-testid="input-from-street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="fromCity">City *</Label>
                        <Input
                          id="fromCity"
                          placeholder="e.g., Chilliwack"
                          value={formData.fromCity}
                          onChange={(e) => handleInputChange('fromCity', e.target.value)}
                          required
                          data-testid="input-from-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromProvince">Province *</Label>
                        <Select
                          value={formData.fromProvince}
                          onValueChange={(value) => handleInputChange('fromProvince', value)}
                        >
                          <SelectTrigger data-testid="select-from-province">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AB">Alberta (AB)</SelectItem>
                            <SelectItem value="BC">British Columbia (BC)</SelectItem>
                            <SelectItem value="MB">Manitoba (MB)</SelectItem>
                            <SelectItem value="NB">New Brunswick (NB)</SelectItem>
                            <SelectItem value="NL">Newfoundland and Labrador (NL)</SelectItem>
                            <SelectItem value="NT">Northwest Territories (NT)</SelectItem>
                            <SelectItem value="NS">Nova Scotia (NS)</SelectItem>
                            <SelectItem value="NU">Nunavut (NU)</SelectItem>
                            <SelectItem value="ON">Ontario (ON)</SelectItem>
                            <SelectItem value="PE">Prince Edward Island (PE)</SelectItem>
                            <SelectItem value="QC">Quebec (QC)</SelectItem>
                            <SelectItem value="SK">Saskatchewan (SK)</SelectItem>
                            <SelectItem value="YT">Yukon (YT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="fromPhone">Phone Number *</Label>
                      <Input
                        id="fromPhone"
                        placeholder="e.g., 1-800-225-7564"
                        value={formData.fromPhone}
                        onChange={(e) => handleInputChange('fromPhone', e.target.value)}
                        required
                        data-testid="input-from-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromAttention">Contact Person</Label>
                      <Input
                        id="fromAttention"
                        placeholder="e.g., John Smith"
                        value={formData.fromAttention}
                        onChange={(e) => handleInputChange('fromAttention', e.target.value)}
                        data-testid="input-from-attention"
                      />
                    </div>
                  </>
                )}
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
                {shipmentType === 'pallet' && (
                  <>
                    <div>
                      <Label htmlFor="toCompany">Company Name *</Label>
                      <Input
                        id="toCompany"
                        placeholder="e.g., Recipient Company"
                        value={formData.toCompany}
                        onChange={(e) => handleInputChange('toCompany', e.target.value)}
                        required
                        data-testid="input-to-company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toStreet">Street Address *</Label>
                      <Input
                        id="toStreet"
                        placeholder="e.g., 123 Main St"
                        value={formData.toStreet}
                        onChange={(e) => handleInputChange('toStreet', e.target.value)}
                        required
                        data-testid="input-to-street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="toCity">City *</Label>
                        <Input
                          id="toCity"
                          placeholder="e.g., Kingston"
                          value={formData.toCity}
                          onChange={(e) => handleInputChange('toCity', e.target.value)}
                          required
                          data-testid="input-to-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="toProvince">Province *</Label>
                        <Select
                          value={formData.toProvince}
                          onValueChange={(value) => handleInputChange('toProvince', value)}
                        >
                          <SelectTrigger data-testid="select-to-province">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AB">Alberta (AB)</SelectItem>
                            <SelectItem value="BC">British Columbia (BC)</SelectItem>
                            <SelectItem value="MB">Manitoba (MB)</SelectItem>
                            <SelectItem value="NB">New Brunswick (NB)</SelectItem>
                            <SelectItem value="NL">Newfoundland and Labrador (NL)</SelectItem>
                            <SelectItem value="NT">Northwest Territories (NT)</SelectItem>
                            <SelectItem value="NS">Nova Scotia (NS)</SelectItem>
                            <SelectItem value="NU">Nunavut (NU)</SelectItem>
                            <SelectItem value="ON">Ontario (ON)</SelectItem>
                            <SelectItem value="PE">Prince Edward Island (PE)</SelectItem>
                            <SelectItem value="QC">Quebec (QC)</SelectItem>
                            <SelectItem value="SK">Saskatchewan (SK)</SelectItem>
                            <SelectItem value="YT">Yukon (YT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="toPhone">Phone Number *</Label>
                      <Input
                        id="toPhone"
                        placeholder="e.g., 613-555-1234"
                        value={formData.toPhone}
                        onChange={(e) => handleInputChange('toPhone', e.target.value)}
                        required
                        data-testid="input-to-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toAttention">Contact Person</Label>
                      <Input
                        id="toAttention"
                        placeholder="e.g., Jane Doe"
                        value={formData.toAttention}
                        onChange={(e) => handleInputChange('toAttention', e.target.value)}
                        data-testid="input-to-attention"
                      />
                    </div>
                  </>
                )}
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
              <Label>Shipment Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={shipmentType === 'package' ? 'default' : 'outline'}
                  onClick={() => {
                    setShipmentType('package');
                    setHasRates(false);
                  }}
                  className="h-auto py-4"
                  data-testid="button-shipment-package"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="font-semibold">Package</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={shipmentType === 'envelope' ? 'default' : 'outline'}
                  onClick={() => {
                    setShipmentType('envelope');
                    setHasRates(false);
                  }}
                  className="h-auto py-4"
                  data-testid="button-shipment-envelope"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">✉️</div>
                    <div className="font-semibold">Envelope</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={shipmentType === 'pallet' ? 'default' : 'outline'}
                  onClick={() => {
                    setShipmentType('pallet');
                    setHasRates(false);
                  }}
                  className="h-auto py-4"
                  data-testid="button-shipment-pallet"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🚛</div>
                    <div className="font-semibold">Pallet</div>
                  </div>
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                {shipmentType === 'package' 
                  ? 'For small to medium parcels shipped via courier services'
                  : shipmentType === 'envelope'
                  ? 'For documents and flat items (max 2 lbs) via Stallion Express'
                  : 'For large shipments on pallets via freight carriers'}
              </p>
            </div>
          </div>

          {/* Package/Pallet/Envelope Details */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                {shipmentType === 'package' ? 'Package Details' : shipmentType === 'envelope' ? 'Envelope Details' : 'Pallet Details'}
              </h3>
              
              {/* Unit Selector - hidden for envelopes since they use standard sizes */}
              {shipmentType !== 'envelope' && (
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
              )}
            </div>
            
            {/* Envelope Size Selector */}
            {shipmentType === 'envelope' && (
              <div className="mb-4">
                <Label htmlFor="envelopeSize">Envelope Size</Label>
                <Select 
                  value={envelopeSize} 
                  onValueChange={(value) => {
                    setEnvelopeSize(value);
                    setHasRates(false);
                  }}
                >
                  <SelectTrigger data-testid="select-envelope-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                    <SelectItem value="legal">Legal (8.5" × 14")</SelectItem>
                    <SelectItem value="large">Large Envelope (9" × 12")</SelectItem>
                    <SelectItem value="flat">Flat Rate (12.5" × 9.5")</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Standard envelope dimensions are pre-set</p>
              </div>
            )}
            
            {/* Dimensions - only show for package/pallet, not envelope */}
            {shipmentType !== 'envelope' && (
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
            )}
            
            {/* Weight only for envelope */}
            {shipmentType === 'envelope' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">
                    Weight (lbs)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    required
                    data-testid="input-envelope-weight"
                  />
                  <p className="text-xs text-red-500 mt-1">Max 2 lbs for envelope shipments</p>
                </div>
              </div>
            )}
            
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
                
                {/* LTL Services */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-md font-medium text-gray-900 mb-3">LTL Services</h4>
                  <p className="text-xs text-gray-600 mb-4">
                    These options affect rate calculations. Residential and tailgate charges apply separately to pickup and delivery.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Pickup Location</p>
                      <div>
                        <Label htmlFor="fromResidential">Commercial Pickup</Label>
                        <Select 
                          value={formData.fromResidential}
                          onValueChange={(value) => handleInputChange('fromResidential', value)}
                        >
                          <SelectTrigger data-testid="select-from-residential">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">Yes - Commercial</SelectItem>
                            <SelectItem value="yes">No - Residential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fromTailgate">Tailgate at Pickup</Label>
                        <Select 
                          value={formData.fromTailgate}
                          onValueChange={(value) => handleInputChange('fromTailgate', value)}
                        >
                          <SelectTrigger data-testid="select-from-tailgate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No - Dock Available</SelectItem>
                            <SelectItem value="yes">Yes - Need Tailgate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Delivery Location</p>
                      <div>
                        <Label htmlFor="toResidential">Commercial Delivery</Label>
                        <Select 
                          value={formData.toResidential}
                          onValueChange={(value) => handleInputChange('toResidential', value)}
                        >
                          <SelectTrigger data-testid="select-to-residential">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">Yes - Commercial</SelectItem>
                            <SelectItem value="yes">No - Residential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="toTailgate">Tailgate at Delivery</Label>
                        <Select 
                          value={formData.toTailgate}
                          onValueChange={(value) => handleInputChange('toTailgate', value)}
                        >
                          <SelectTrigger data-testid="select-to-tailgate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No - Dock Available</SelectItem>
                            <SelectItem value="yes">Yes - Need Tailgate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
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
