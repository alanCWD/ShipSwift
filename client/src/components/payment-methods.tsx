import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreditCard, Plus, Trash2, Star, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodsData {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
}

function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const setupIntentResponse = await apiRequest('POST', '/api/stripe/setup-intent');
      const { clientSecret } = await setupIntentResponse.json();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.payment_method) {
        await apiRequest('POST', '/api/stripe/confirm-card-saved', {
          paymentMethodId: setupIntent.payment_method,
          setAsDefault,
        });

        toast({
          title: "Card Added",
          description: "Your card has been saved successfully.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Failed to Add Card",
        description: error.message || "There was an error saving your card.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="setAsDefault"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
          data-testid="checkbox-set-default-card"
        />
        <label htmlFor="setAsDefault" className="text-sm text-gray-600">
          Set as default payment method
        </label>
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-save-card"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-add-card">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PaymentMethodsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCard, setIsAddingCard] = useState(false);

  const { data, isLoading, error } = useQuery<PaymentMethodsData>({
    queryKey: ['/api/stripe/payment-methods'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await apiRequest('DELETE', `/api/stripe/payment-methods/${paymentMethodId}`);
    },
    onSuccess: () => {
      toast({
        title: "Card Removed",
        description: "The payment method has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Card",
        description: error.message || "Could not remove the payment method.",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await apiRequest('POST', `/api/stripe/payment-methods/${paymentMethodId}/default`);
    },
    onSuccess: () => {
      toast({
        title: "Default Updated",
        description: "Your default payment method has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Default",
        description: error.message || "Could not update the default payment method.",
        variant: "destructive",
      });
    },
  });

  const getCardBrandIcon = (brand: string) => {
    return <CreditCard className="w-8 h-8 text-gray-600" />;
  };

  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        Unable to load payment methods. Please try again.
      </div>
    );
  }

  const paymentMethods = data?.paymentMethods || [];

  return (
    <div className="space-y-4">
      {paymentMethods.length === 0 && !isAddingCard ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No payment methods saved</p>
          <Button onClick={() => setIsAddingCard(true)} data-testid="button-add-first-card">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <>
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-white"
              data-testid={`card-payment-method-${pm.last4}`}
            >
              <div className="flex items-center space-x-4">
                {getCardBrandIcon(pm.brand)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatBrand(pm.brand)} ending in {pm.last4}</span>
                    {pm.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Expires {pm.expMonth.toString().padStart(2, '0')}/{pm.expYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!pm.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(pm.id)}
                    disabled={setDefaultMutation.isPending}
                    data-testid={`button-set-default-${pm.last4}`}
                  >
                    Set as Default
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-testid={`button-delete-card-${pm.last4}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove the card ending in {pm.last4}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(pm.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          {!isAddingCard && (
            <Button
              variant="outline"
              onClick={() => setIsAddingCard(true)}
              className="w-full"
              data-testid="button-add-another-card"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Card
            </Button>
          )}
        </>
      )}

      {isAddingCard && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">Add New Card</h4>
          <AddCardForm
            onSuccess={() => {
              setIsAddingCard(false);
              queryClient.invalidateQueries({ queryKey: ['/api/stripe/payment-methods'] });
            }}
            onCancel={() => setIsAddingCard(false)}
          />
        </div>
      )}
    </div>
  );
}

export default function PaymentMethods() {
  const { data: stripeConfig, isLoading: configLoading } = useQuery<{ publishableKey: string }>({
    queryKey: ['/api/stripe/config'],
  });

  if (configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stripeConfig?.publishableKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Payment service is not configured. Please contact support.
          </div>
        </CardContent>
      </Card>
    );
  }

  const stripePromise = loadStripe(stripeConfig.publishableKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Manage your saved payment methods for future shipments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Overage Policy</p>
              <p className="mt-1">
                If a carrier determines that your shipment exceeds the dimensions or weight you provided,
                you authorize us to charge the difference to your saved payment method.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <Elements stripe={stripePromise}>
          <PaymentMethodsList />
        </Elements>
      </CardContent>
    </Card>
  );
}
