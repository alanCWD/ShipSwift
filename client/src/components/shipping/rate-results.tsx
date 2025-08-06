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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transit Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (CAD)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate, index) => {
                  const total = calculateTotal(rate);
                  // Handle both sample rates and real API format
                  const carrierName = rate.carrierName || rate.carrier?.name || 'Unknown Carrier';
                  const serviceName = rate.serviceName || rate.service?.name || 'Standard Service';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-8 ${getCarrierColor(carrierName)} rounded flex items-center justify-center mr-3`}>
                            <span className="text-white font-bold text-xs">
                              {getCarrierInitials(carrierName)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{carrierName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{serviceName}</div>
                        <div className="text-sm text-gray-500">{rate.serviceType || 'Standard'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rate.deliveryDays || rate.transitTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">
                          ${total.toFixed(2)} <span className="text-sm font-normal text-gray-600">CAD</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          onClick={() => setSelectedRate(rate)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          size="sm"
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
