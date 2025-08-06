import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ShipmentForm from './shipment-form';
import { Clock, Truck } from 'lucide-react';

interface RateResultsProps {
  rates: any[];
}

export default function RateResults({ rates }: RateResultsProps) {
  const [selectedRate, setSelectedRate] = useState(null);

  const getCarrierColor = (carrierName: string) => {
    const colors: Record<string, string> = {
      'Canada Post': 'bg-red-600',
      'Purolator': 'bg-blue-800',
      'UPS': 'bg-amber-600',
      'FedEx': 'bg-purple-600',
      'DHL': 'bg-yellow-500',
    };
    return colors[carrierName] || 'bg-gray-600';
  };

  const getCarrierInitials = (carrierName: string) => {
    const initials: Record<string, string> = {
      'Canada Post': 'CP',
      'Purolator': 'PUR',
      'UPS': 'UPS',
      'FedEx': 'FDX',
      'DHL': 'DHL',
    };
    return initials[carrierName] || carrierName.slice(0, 3).toUpperCase();
  };

  const calculateTotal = (rate: any) => {
    // Handle sample rates format (has totalCharge or price as string)
    if (rate.totalCharge) {
      return parseFloat(rate.totalCharge);
    }
    if (rate.price) {
      return parseFloat(rate.price);
    }
    
    // Handle real API format (has baseCharge.amount in cents)
    let total = 0;
    
    if (rate.baseCharge?.amount) {
      total += rate.baseCharge.amount / 100; // Convert from cents
    }
    
    if (rate.surcharges) {
      rate.surcharges.forEach((surcharge: any) => {
        if (surcharge.price?.amount) {
          total += surcharge.price.amount / 100;
        }
      });
    }
    
    if (rate.taxes) {
      rate.taxes.forEach((tax: any) => {
        if (tax.price?.amount) {
          total += tax.price.amount / 100;
        }
      });
    }
    
    return total;
  };

  if (!rates || rates.length === 0) {
    return null;
  }

  if (selectedRate) {
    return <ShipmentForm rate={selectedRate} onBack={() => setSelectedRate(null)} />;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Available Shipping Options</h2>
        <div className="space-y-4">
          {rates.map((rate, index) => {
            const total = calculateTotal(rate);
            // Handle both sample rates and real API format
            const carrierName = rate.carrierName || rate.carrier?.name || 'Unknown Carrier';
            const serviceName = rate.serviceName || rate.service?.name || 'Standard Service';
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-12 ${getCarrierColor(carrierName)} rounded flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">
                          {getCarrierInitials(carrierName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{carrierName}</h3>
                        <p className="text-sm text-gray-600">{serviceName}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {(rate.deliveryDays || rate.transitTime) && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {rate.deliveryDays || rate.transitTime}
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <Truck className="w-3 h-3 mr-1" />
                            {rate.serviceType || 'Standard'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${total.toFixed(2)} <span className="text-sm font-normal text-gray-600">CAD</span>
                      </p>
                      <Button 
                        onClick={() => setSelectedRate(rate)}
                        className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                  
                  {/* Rate breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-1">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
