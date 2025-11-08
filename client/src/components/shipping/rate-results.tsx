import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ShipmentForm from './shipment-form';
import PickupOptions from './pickup-options';
import InsuranceModal from './insurance-modal';
import { CarrierLogo } from '@/components/ui/carrier-logo';
import { Clock, Truck, Shield, Edit, Info } from 'lucide-react';

interface RateResultsProps {
  rates: any[];
  addressData?: any;
}

export default function RateResults({ rates, addressData }: RateResultsProps) {
  const [selectedRate, setSelectedRate] = useState(null);
  const [showPickupOptions, setShowPickupOptions] = useState(false);
  const [pickupDetails, setPickupDetails] = useState(null);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false); // Default to off
  const [insuranceData, setInsuranceData] = useState<any>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);



  const calculatePricing = (rate: any) => {
    // IMPORTANT: Check for marked up API format FIRST (has subtotal and taxAmount)
    // This must come before totalCharge check because backend adds both
    if (rate.subtotal !== undefined && rate.taxAmount !== undefined) {
      const subtotal = Number(rate.subtotal);
      const tax = Number(rate.taxAmount);
      
      return {
        subtotal, // Base + markup + surcharges (pre-tax)
        tax,
        total: subtotal + tax,
        markup: Number(rate.markup || 0)
      };
    }
    
    // Handle sample rates format (has totalCharge or price as string)
    if (rate.totalCharge) {
      return {
        subtotal: parseFloat(rate.totalCharge),
        tax: 0,
        total: parseFloat(rate.totalCharge),
        markup: 0
      };
    }
    if (rate.price) {
      return {
        subtotal: parseFloat(rate.price),
        tax: 0,
        total: parseFloat(rate.price),
        markup: 0
      };
    }
    
    // Handle legacy API format (has baseCharge.amount in cents)
    let subtotal = 0;
    let tax = 0;
    
    if (rate.baseCharge?.amount) {
      subtotal = rate.baseCharge.amount / 100; // Convert from cents
    }
    
    const hasSeparateSurcharges = rate.surcharges && rate.surcharges.length > 0;
    const hasSeparateTaxes = rate.taxes && rate.taxes.length > 0;
    
    if (hasSeparateSurcharges) {
      rate.surcharges.forEach((surcharge: any) => {
        if (surcharge.price?.amount) {
          subtotal += surcharge.price.amount / 100;
        }
      });
    }
    
    if (hasSeparateTaxes) {
      rate.taxes.forEach((taxItem: any) => {
        if (taxItem.price?.amount) {
          tax += taxItem.price.amount / 100;
        }
      });
    }
    
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      markup: 0
    };
  };

  if (!rates || rates.length === 0) {
    return null;
  }

  const handleRateSelection = (rate: any) => {
    setSelectedRate(rate);
    setShowPickupOptions(true);
  };

  const handlePickupDetailsComplete = (details: any) => {
    setPickupDetails(details);
    setShowPickupOptions(false);
  };

  const handleBackFromPickup = () => {
    setShowPickupOptions(false);
    setSelectedRate(null);
  };

  const handleBackFromShipment = () => {
    setShowPickupOptions(true);
  };

  const handleInsuranceToggle = (enabled: boolean) => {
    setInsuranceEnabled(enabled);
    // Don't auto-set insurance data - let user configure via modal
  };

  const handleInsuranceSave = (data: any) => {
    setInsuranceData(data);
  };

  // Show pickup options after rate selection
  if (selectedRate && showPickupOptions) {
    return (
      <>
        <PickupOptions 
          rate={selectedRate}
          addressData={addressData}
          onPickupDetailsComplete={handlePickupDetailsComplete}
          onBack={handleBackFromPickup}
        />
        <InsuranceModal
          isOpen={showInsuranceModal}
          onClose={() => setShowInsuranceModal(false)}
          onSave={handleInsuranceSave}
          initialData={insuranceData}
        />
      </>
    );
  }

  // Show shipment form after pickup details are complete
  if (selectedRate && pickupDetails && !showPickupOptions) {
    return (
      <ShipmentForm 
        rate={selectedRate} 
        pickupDetails={pickupDetails}
        addressData={addressData}
        onBack={handleBackFromShipment} 
      />
    );
  }

  // Sort rates by total price (lowest to highest)
  const sortedRates = [...rates].sort((a, b) => {
    const pricingA = calculatePricing(a);
    const pricingB = calculatePricing(b);
    return pricingA.total - pricingB.total;
  });

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
                {sortedRates.map((rate, index) => {
                  const pricing = calculatePricing(rate);
                  // Handle both sample rates and real API format
                  const carrierName = rate.carrierName || rate.carrier?.name || 'Unknown Carrier';
                  const serviceName = rate.serviceName || rate.service?.name || 'Standard Service';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-3 hidden md:block">
                            <CarrierLogo carrierName={carrierName} className="w-10 h-8" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{carrierName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{serviceName}</div>
                        <div className="text-sm text-gray-500">{rate.serviceType || 'Standard'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {rate.transitDays 
                            ? `${rate.transitDays} ${rate.transitUnit || 'business days'}`
                            : (rate.deliveryDays || rate.transitTime || 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              ${pricing.subtotal.toFixed(2)} <span className="text-sm font-normal text-gray-600">CAD</span>
                            </div>
                            {pricing.tax > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                + ${pricing.tax.toFixed(2)} tax
                              </div>
                            )}
                            {pricing.tax > 0 && (
                              <div className="text-xs font-medium text-gray-700 mt-0.5">
                                Total: ${pricing.total.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="mt-1 text-gray-400 hover:text-gray-600 transition-colors">
                                  <Info className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-4" side="left">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm mb-3 border-b pb-2">Rate Breakdown</h4>
                                  
                                  {(() => {
                                    // Base Rate = originalBaseCharge + markup (both include markup applied to base only)
                                    // Convert to numbers to prevent NaN
                                    const baseRate = Number(rate.originalBaseCharge || 0) + Number(rate.markup || 0);
                                    
                                    return (
                                      <>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">Base Rate:</span>
                                          <span>${baseRate.toFixed(2)}</span>
                                        </div>
                                        
                                        {rate.surcharges && rate.surcharges.length > 0 && rate.surcharges.map((surcharge: any, idx: number) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{surcharge.name || 'Surcharge'}:</span>
                                            <span>${(Number(surcharge.price.amount) / 100).toFixed(2)}</span>
                                          </div>
                                        ))}
                                        
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                          <span className="font-bold">Before Tax Total:</span>
                                          <span className="font-bold">${Number(pricing.subtotal).toFixed(2)}</span>
                                        </div>
                                        
                                        {pricing.tax > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax:</span>
                                            <span>${Number(pricing.tax).toFixed(2)}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                          <span className="font-bold">After Tax Total:</span>
                                          <span className="font-bold">${Number(pricing.total).toFixed(2)}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          onClick={() => handleRateSelection(rate)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          size="sm"
                          data-testid={`button-select-rate-${index}`}
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

        {/* Insurance Section */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Insurance</h3>
                  <p className="text-sm text-gray-600">Protect your shipment beyond the carrier's liability for any loss or damage to your Parcel Shipment with additional coverage.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {insuranceEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInsuranceModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Insurance
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="insurance"
                    checked={insuranceEnabled}
                    onCheckedChange={handleInsuranceToggle}
                  />
                  <Label htmlFor="insurance">Add Insurance</Label>
                </div>
              </div>
            </div>
          </div>

          {insuranceEnabled && insuranceData && (
            <div className="p-6 bg-blue-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Coverage Value</Label>
                  <p className="text-lg font-semibold">${insuranceData.totalValue} {insuranceData.currency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Insurance Type</Label>
                  <p className="text-lg font-semibold capitalize">{insuranceData.insuranceType}</p>
                </div>
                {insuranceData.insuranceType === 'shipswift' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Signature</Label>
                    <p className="text-sm">
                      {insuranceData.signatureType === 'adult_signature_required' 
                        ? 'Adult Signature Required' 
                        : 'Signature Required'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insurance Modal */}
      <InsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        onSave={handleInsuranceSave}
        initialData={insuranceData}
      />
    </div>
  );
}
