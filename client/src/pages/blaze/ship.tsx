import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Cannabis, Package, Mail, Loader2, ArrowLeft, Truck, DollarSign, Clock } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { Link } from "wouter";

interface ShippingRate {
  carrierName: string;
  serviceName: string;
  subtotal: number;
  taxAmount: number;
  transitTime?: string;
  deliveryDays?: number;
}

export default function BlazeShip() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shipmentType, setShipmentType] = useState<'package' | 'envelope'>('envelope');
  const [fromPostalCode, setFromPostalCode] = useState('');
  const [toPostalCode, setToPostalCode] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  if (!user?.blazeAccess && user?.role !== 'admin' && user?.role !== 'ablp_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Cannabis className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Access Required</h2>
              <p>You need Blaze Portal access to create shipments.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getRatesMutation = useMutation({
    mutationFn: async (): Promise<ShippingRate[]> => {
      const response = await apiRequest('/api/blaze/rates', 'POST', {
        fromPostalCode: fromPostalCode.replace(/\s+/g, '').toUpperCase(),
        toPostalCode: toPostalCode.replace(/\s+/g, '').toUpperCase(),
        weight: parseFloat(weight),
        length: parseFloat(length) || 10,
        width: parseFloat(width) || 10,
        height: parseFloat(height) || 10,
        shipmentType,
      });
      return response as ShippingRate[];
    },
    onSuccess: (data: ShippingRate[]) => {
      setRates(data || []);
      if (data.length === 0) {
        toast({
          title: "No Rates Available",
          description: "No cannabis-friendly carriers available for this route.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch rates",
        variant: "destructive",
      });
    },
  });

  const handleGetRates = () => {
    if (!fromPostalCode || !toPostalCode || !weight) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    getRatesMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/blaze">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Cannabis className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Create Blaze Shipment</h1>
            <p className="text-muted-foreground">Ship with cannabis-friendly carriers only</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Type</CardTitle>
                <CardDescription>Pallets are not available for cannabis shipments</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shipmentType} onValueChange={(v) => setShipmentType(v as 'package' | 'envelope')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="envelope" id="envelope" data-testid="radio-envelope" />
                    <Label htmlFor="envelope" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Mail className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Envelope</p>
                        <p className="text-sm text-muted-foreground">Documents and flat items (max 2 lbs)</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="package" id="package" data-testid="radio-package" />
                    <Label htmlFor="package" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Package className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Package</p>
                        <p className="text-sm text-muted-foreground">Standard parcel shipment</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromPostalCode">From Postal Code *</Label>
                    <Input
                      id="fromPostalCode"
                      placeholder="A1A 1A1"
                      value={fromPostalCode}
                      onChange={(e) => setFromPostalCode(e.target.value)}
                      data-testid="input-from-postal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toPostalCode">To Postal Code *</Label>
                    <Input
                      id="toPostalCode"
                      placeholder="B2B 2B2"
                      value={toPostalCode}
                      onChange={(e) => setToPostalCode(e.target.value)}
                      data-testid="input-to-postal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="1.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    max={shipmentType === 'envelope' ? 2 : undefined}
                    data-testid="input-weight"
                  />
                  {shipmentType === 'envelope' && (
                    <p className="text-xs text-muted-foreground">Maximum 2 lbs for envelopes</p>
                  )}
                </div>

                {shipmentType === 'package' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (in)</Label>
                      <Input
                        id="length"
                        type="number"
                        placeholder="10"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        data-testid="input-length"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (in)</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="10"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        data-testid="input-width"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (in)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="10"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        data-testid="input-height"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleGetRates}
                  disabled={getRatesMutation.isPending}
                  className="w-full"
                  data-testid="button-get-rates"
                >
                  {getRatesMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting Rates...</>
                  ) : (
                    'Get Shipping Rates'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Available Rates
                </CardTitle>
                <CardDescription>
                  Only cannabis-friendly Canadian carriers are shown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getRatesMutation.isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : rates.length > 0 ? (
                  <div className="space-y-3">
                    {rates.map((rate, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRate === rate 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedRate(rate)}
                        data-testid={`rate-option-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{rate.serviceName}</p>
                            <p className="text-sm text-muted-foreground">{rate.carrierName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">
                              {formatCurrency(rate.subtotal + rate.taxAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              incl. {formatCurrency(rate.taxAmount)} tax
                            </p>
                          </div>
                        </div>
                        {(rate.transitTime || rate.deliveryDays) && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {rate.transitTime || `${rate.deliveryDays} business days`}
                          </div>
                        )}
                      </div>
                    ))}

                    {selectedRate && (
                      <Button className="w-full mt-4" size="lg" data-testid="button-continue-shipment">
                        Continue with {selectedRate.serviceName}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter shipping details and click "Get Shipping Rates"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
