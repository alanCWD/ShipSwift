import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Package, Calculator } from 'lucide-react';

interface RateComparison {
  negotiatedRate: number;
  standardRate: number;
  savings: number;
  savingsPercentage: number;
  carrier: string;
  service: string;
}

interface CarrierRate {
  carrier: string;
  service: string;
  rate: number;
  transitTime?: string;
  isNegotiated: boolean;
}

export default function RateComparisonPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fromAddress: {
      countryCode: 'CA',
      postalCode: 'V2R4H1',
      city: 'Chilliwack',
      state: 'BC'
    },
    toAddress: {
      countryCode: 'CA',
      postalCode: 'V6B1A1',
      city: 'Vancouver',
      state: 'BC'
    },
    packageDetails: {
      length: 30,
      width: 20,
      height: 10,
      weight: 1
    }
  });

  const [results, setResults] = useState<{
    comparisons: RateComparison[];
    negotiatedRates: CarrierRate[];
    standardRates: CarrierRate[];
    summary: {
      totalComparisons: number;
      averageSavings: number;
      averageSavingsPercentage: number;
    };
  } | null>(null);

  const compareRatesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/rate-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to compare rates');
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Rate Comparison Complete",
        description: `Found ${data.comparisons.length} rate comparisons with average savings of ${data.summary.averageSavingsPercentage.toFixed(1)}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Comparison Failed",
        description: error.message || "Failed to compare rates",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    compareRatesMutation.mutate(formData);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Calculator className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Real-Time Rate Comparison</h1>
          <p className="text-gray-600">Compare GoABLP negotiated rates vs standard carrier rates</p>
        </div>
      </div>

      {/* Rate Comparison Form */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Shipping Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Address */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">From Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromPostalCode">Postal Code</Label>
                    <Input
                      id="fromPostalCode"
                      value={formData.fromAddress.postalCode}
                      onChange={(e) => handleInputChange('fromAddress', 'postalCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromCity">City</Label>
                    <Input
                      id="fromCity"
                      value={formData.fromAddress.city}
                      onChange={(e) => handleInputChange('fromAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromState">Province</Label>
                    <Input
                      id="fromState"
                      value={formData.fromAddress.state}
                      onChange={(e) => handleInputChange('fromAddress', 'state', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromCountry">Country</Label>
                    <Input
                      id="fromCountry"
                      value={formData.fromAddress.countryCode}
                      onChange={(e) => handleInputChange('fromAddress', 'countryCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* To Address */}
              <div className="space-y-4">
                <h3 className="font-medium">To Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toPostalCode">Postal Code</Label>
                    <Input
                      id="toPostalCode"
                      value={formData.toAddress.postalCode}
                      onChange={(e) => handleInputChange('toAddress', 'postalCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toCity">City</Label>
                    <Input
                      id="toCity"
                      value={formData.toAddress.city}
                      onChange={(e) => handleInputChange('toAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toState">Province</Label>
                    <Input
                      id="toState"
                      value={formData.toAddress.state}
                      onChange={(e) => handleInputChange('toAddress', 'state', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toCountry">Country</Label>
                    <Input
                      id="toCountry"
                      value={formData.toAddress.countryCode}
                      onChange={(e) => handleInputChange('toAddress', 'countryCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-4">
              <h3 className="font-medium">Package Details</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.packageDetails.length}
                    onChange={(e) => handleInputChange('packageDetails', 'length', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.packageDetails.width}
                    onChange={(e) => handleInputChange('packageDetails', 'width', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.packageDetails.height}
                    onChange={(e) => handleInputChange('packageDetails', 'height', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.packageDetails.weight}
                    onChange={(e) => handleInputChange('packageDetails', 'weight', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={compareRatesMutation.isPending}
              className="w-full"
            >
              {compareRatesMutation.isPending ? 'Comparing Rates...' : 'Compare Rates'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">{results.summary.totalComparisons}</div>
                    <div className="text-sm text-gray-600">Rate Comparisons</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">${results.summary.averageSavings.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Average Savings</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">{results.summary.averageSavingsPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Average Savings %</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparisons */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Rate Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.comparisons.map((comparison, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{comparison.carrier}</h4>
                        <p className="text-sm text-gray-600">{comparison.service}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-green-600">
                          ${comparison.savings.toFixed(2)} saved
                        </div>
                        <div className="text-sm text-green-600">
                          {comparison.savingsPercentage.toFixed(1)}% savings
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">GoABLP Rate:</span>
                        <span className="ml-2 font-medium">${comparison.negotiatedRate.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Standard Rate:</span>
                        <span className="ml-2 font-medium">${comparison.standardRate.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}