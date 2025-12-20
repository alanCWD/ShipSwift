import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { initializeStripe, getStripeEnvironment } from '@/lib/stripe-config';
import type { Stripe } from '@stripe/stripe-js';

interface ShipmentFormProps {
  rate: any;
  pickupDetails?: any;
  addressData?: any;
  onBack: () => void;
}

interface ShippingDetails {
  fromName: string;
  fromAddress: string;
  fromCity: string;
  fromProvince: string;
  fromPostalCode: string;
  fromCountry: string;
  fromPhone: string;
  toName: string;
  toAddress: string;
  toCity: string;
  toProvince: string;
  toPostalCode: string;
  toCountry: string;
  toPhone: string;
}

function PaymentForm({ clientSecret, onPaymentSuccess }: { clientSecret: string; onPaymentSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your shipment has been created and paid for.",
        });
        // Auto-redirect to dashboard after successful payment
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
        onPaymentSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing Payment...' : 'Complete Shipment'}
      </Button>
    </form>
  );
}

export default function ShipmentForm({ rate, pickupDetails, addressData, onBack }: ShipmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<Promise<Stripe | null> | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fromName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (addressData?.fromAttention || ''),
    fromAddress: addressData?.fromStreet || '44322 Yale Rd #3',
    fromCity: addressData?.fromCity || 'Chilliwack',
    fromProvince: addressData?.fromProvince || 'BC',
    fromPostalCode: addressData?.fromPostalCode || 'V2R 4H1',
    fromCountry: addressData?.fromCountry || 'CA',
    fromPhone: addressData?.fromPhone || '1-800-225-7564',
    toName: addressData?.toAttention || '',
    toAddress: addressData?.toStreet || '',
    toCity: addressData?.toCity || '',
    toProvince: addressData?.toProvince || '',
    toPostalCode: addressData?.toPostalCode || '',
    toCountry: addressData?.toCountry || 'CA',
    toPhone: addressData?.toPhone || '',
  });

  // Initialize Stripe when we have a client secret (payment step is reached)
  useEffect(() => {
    const loadStripe = async () => {
      if (clientSecret && !stripeInstance && !isLoadingStripe) {
        setIsLoadingStripe(true);
        try {
          const stripe = await initializeStripe();
          if (stripe) {
            setStripeInstance(Promise.resolve(stripe));
            console.log('Stripe loaded for payment, environment:', getStripeEnvironment());
          } else {
            toast({
              title: "Payment Configuration Error",
              description: "Unable to load payment system. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Failed to load Stripe:', error);
          toast({
            title: "Payment Configuration Error",
            description: "Unable to load payment system. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingStripe(false);
        }
      }
    };
    loadStripe();
  }, [clientSecret, stripeInstance, isLoadingStripe, toast]);

  // Scroll to payment section when moving to payment step
  useEffect(() => {
    if (currentStep === 2 && paymentSectionRef.current) {
      paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  const calculateTotal = (rate: any) => {
    // Handle sample rates format (has totalCharge or price as string)
    if (rate.totalCharge) {
      return parseFloat(rate.totalCharge);
    }
    if (rate.price) {
      return parseFloat(rate.price);
    }
    
    // Handle real API format (has baseCharge.amount in cents)
    // For some shipment types (e.g., LTL/pallet), baseCharge may already include surcharges/taxes
    // Check if surcharges/taxes arrays exist and have items before adding them
    let total = 0;
    
    if (rate.baseCharge?.amount) {
      total = rate.baseCharge.amount / 100; // Convert from cents
    }
    
    // Only add surcharges if they exist AND are separate from baseCharge
    // (some API responses include them in baseCharge already)
    const hasSeparateSurcharges = rate.surcharges && rate.surcharges.length > 0;
    const hasSeparateTaxes = rate.taxes && rate.taxes.length > 0;
    
    if (hasSeparateSurcharges) {
      rate.surcharges.forEach((surcharge: any) => {
        if (surcharge.price?.amount) {
          total += surcharge.price.amount / 100;
        }
      });
    }
    
    if (hasSeparateTaxes) {
      rate.taxes.forEach((tax: any) => {
        if (tax.price?.amount) {
          total += tax.price.amount / 100;
        }
      });
    }
    
    return total;
  };

  const shipmentMutation = useMutation({
    mutationFn: async (shipmentData: any) => {
      const response = await apiRequest('POST', '/api/shipments', shipmentData);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setCurrentStep(2);
    },
    onError: (error: any) => {
      toast({
        title: "Shipment Creation Failed",
        description: error.message || "Unable to create shipment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a shipment.",
        variant: "destructive",
      });
      return;
    }

    // Validate confirmation checkbox
    if (!confirmationChecked) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that all shipping information is correct before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const requiredFields = ['toName', 'toAddress', 'toCity', 'toProvince', 'toPostalCode', 'toPhone'];
    const missingFields = requiredFields.filter(field => !shippingDetails[field as keyof ShippingDetails]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal(rate);
    
    const shipmentData = {
      rateId: rate.rateId || rate.id,
      carrierName: rate.carrierName || rate.carrier?.name || 'Unknown Carrier',
      serviceName: rate.serviceName || rate.service?.name || 'Standard Service',
      fromAddress: {
        attention: shippingDetails.fromName,
        streetAddress: shippingDetails.fromAddress,
        city: shippingDetails.fromCity,
        state: shippingDetails.fromProvince,
        postalCode: shippingDetails.fromPostalCode,
        countryCode: shippingDetails.fromCountry,
        phone: shippingDetails.fromPhone,
      },
      toAddress: {
        attention: shippingDetails.toName,
        streetAddress: shippingDetails.toAddress,
        city: shippingDetails.toCity,
        state: shippingDetails.toProvince,
        postalCode: shippingDetails.toPostalCode,
        countryCode: shippingDetails.toCountry,
        phone: shippingDetails.toPhone,
      },
      packageDetails: rate.lineItems?.[0] || {},
      baseCost: total.toString(),
    };

    shipmentMutation.mutate(shipmentData);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Shipment Created Successfully", 
      description: "Your shipping label has been generated and payment processed. Check your dashboard to download the label.",
      duration: 8000, // Show longer so user can read the message
    });
    
    // Small delay before redirect to let user read the success message
    setTimeout(() => {
      onBack(); // Return to dashboard
    }, 2000);
  };

  const total = calculateTotal(rate);

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rates
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <div className="flex-1 h-1 bg-gray-300">
              <div className={`h-1 bg-blue-600 transition-all ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Details Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Shipping Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-6">
                    {/* From Address */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        Ship From (GoABLP)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fromName">Contact Name</Label>
                          <Input
                            id="fromName"
                            value={shippingDetails.fromName}
                            onChange={(e) => handleInputChange('fromName', e.target.value)}
                            placeholder="Contact Name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromPhone">Phone</Label>
                          <Input
                            id="fromPhone"
                            value={shippingDetails.fromPhone}
                            onChange={(e) => handleInputChange('fromPhone', e.target.value)}
                            placeholder="Phone Number"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="fromAddress">Address</Label>
                          <Input
                            id="fromAddress"
                            value={shippingDetails.fromAddress}
                            onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                            placeholder="Street Address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromCity">City</Label>
                          <Input
                            id="fromCity"
                            value={shippingDetails.fromCity}
                            onChange={(e) => handleInputChange('fromCity', e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromProvince">Province</Label>
                          <Input
                            id="fromProvince"
                            value={shippingDetails.fromProvince}
                            onChange={(e) => handleInputChange('fromProvince', e.target.value)}
                            placeholder="Province"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromPostalCode">Postal Code</Label>
                          <Input
                            id="fromPostalCode"
                            value={shippingDetails.fromPostalCode}
                            onChange={(e) => handleInputChange('fromPostalCode', e.target.value)}
                            placeholder="Postal Code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromCountry">Country</Label>
                          <Input
                            id="fromCountry"
                            value={shippingDetails.fromCountry}
                            onChange={(e) => handleInputChange('fromCountry', e.target.value)}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* To Address */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        Ship To
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="toName">Contact Name *</Label>
                          <Input
                            id="toName"
                            value={shippingDetails.toName}
                            onChange={(e) => handleInputChange('toName', e.target.value)}
                            placeholder="Recipient Name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="toPhone">Phone *</Label>
                          <Input
                            id="toPhone"
                            value={shippingDetails.toPhone}
                            onChange={(e) => handleInputChange('toPhone', e.target.value)}
                            placeholder="Phone Number"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="toAddress">Address *</Label>
                          <Input
                            id="toAddress"
                            value={shippingDetails.toAddress}
                            onChange={(e) => handleInputChange('toAddress', e.target.value)}
                            placeholder="Street Address"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="toCity">City *</Label>
                          <Input
                            id="toCity"
                            value={shippingDetails.toCity}
                            onChange={(e) => handleInputChange('toCity', e.target.value)}
                            placeholder="City"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="toProvince">Province *</Label>
                          <Input
                            id="toProvince"
                            value={shippingDetails.toProvince}
                            onChange={(e) => handleInputChange('toProvince', e.target.value)}
                            placeholder="Province"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="toPostalCode">Postal Code *</Label>
                          <Input
                            id="toPostalCode"
                            value={shippingDetails.toPostalCode}
                            onChange={(e) => handleInputChange('toPostalCode', e.target.value)}
                            placeholder="Postal Code"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="toCountry">Country *</Label>
                          <Input
                            id="toCountry"
                            value={shippingDetails.toCountry}
                            onChange={(e) => handleInputChange('toCountry', e.target.value)}
                            placeholder="Country"
                            required
                          />
                        </div>
                      </div>
                    </div>

                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Carrier:</span>
                    <span>{rate.carrierName || rate.carrier?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{rate.serviceName || rate.service?.name || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Transit Time:</span>
                    <span>{rate.transitTime || rate.deliveryDays || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    {/* Show breakdown for real API rates */}
                    {rate.baseCharge?.amount && (
                      <div className="flex justify-between">
                        <span>Base Rate:</span>
                        <span>${(rate.baseCharge.amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {rate.surcharges?.map((surcharge: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{surcharge.name || 'Surcharge'}:</span>
                        <span>${(surcharge.price.amount / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    {rate.taxes?.map((tax: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{tax.name || 'Tax'}:</span>
                        <span>${(tax.price.amount / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    {/* Show simple rate for sample rates */}
                    {(rate.totalCharge || rate.price) && !rate.baseCharge?.amount && (
                      <div className="flex justify-between">
                        <span>Shipping Rate:</span>
                        <span>${parseFloat(rate.totalCharge || rate.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total:</span>
                    <span>${total.toFixed(2)} CAD</span>
                  </div>
                  
                  {/* Confirmation Checkbox */}
                  <div className="flex items-start space-x-3 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Checkbox 
                      id="confirm-details"
                      checked={confirmationChecked}
                      onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                      className="mt-1"
                      data-testid="checkbox-confirm-details"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="confirm-details" 
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        I confirm that all shipping information is correct
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Please verify all addresses and details before proceeding to payment
                      </p>
                    </div>
                  </div>
                  
                  {/* Continue to Payment Button moved below Total */}
                  <Button 
                    onClick={() => handleShippingSubmit(new Event('submit') as any)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={shipmentMutation.isPending || !confirmationChecked}
                    data-testid="button-continue-payment"
                  >
                    {shipmentMutation.isPending ? 'Creating Shipment...' : 'Continue to Payment'}
                  </Button>
                  {!confirmationChecked && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Please confirm the information is correct to continue
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 2 && clientSecret && (
          <div ref={paymentSectionRef} className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-semibold">Total: ${total.toFixed(2)} CAD</p>
                    <p className="text-sm text-gray-600">
                      {rate.carrierName || rate.carrier?.name} - {rate.serviceName || rate.service?.name}
                    </p>
                  </div>
                </div>
                {isLoadingStripe ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading payment form...</span>
                  </div>
                ) : stripeInstance ? (
                  <Elements stripe={stripeInstance} options={{ clientSecret }}>
                    <PaymentForm clientSecret={clientSecret} onPaymentSuccess={handlePaymentSuccess} />
                  </Elements>
                ) : (
                  <div className="text-center py-8 text-red-600">
                    <p>Unable to load payment form. Please refresh and try again.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
