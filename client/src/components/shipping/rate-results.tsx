import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ShipmentForm from './shipment-form';
import PickupOptions from './pickup-options';
import InsuranceModal from './insurance-modal';
import { Clock, Truck, Shield, Edit } from 'lucide-react';

interface RateResultsProps {
  rates: any[];
}

export default function RateResults({ rates }: RateResultsProps) {
  const [selectedRate, setSelectedRate] = useState(null);
  const [showPickupOptions, setShowPickupOptions] = useState(false);
  const [pickupDetails, setPickupDetails] = useState(null);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true); // Default to enabled
  const [insuranceData, setInsuranceData] = useState<any>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

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
    if (enabled && !insuranceData) {
      // Set default insurance data when first enabled
      setInsuranceData({
        totalValue: '100',
        currency: 'CAD',
        insuranceType: 'shipswift',
        signatureType: 'signature_required',
        termsAccepted: false,
        carrierTermsAccepted: false,
      });
    }
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
        onBack={handleBackFromShipment} 
      />
    );
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
                          onClick={() => handleRateSelection(rate)}
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

        {/* Insurance Section */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Insurance</h3>
                  <p className="text-sm text-gray-600">Protect your shipment with additional coverage</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {insuranceEnabled && insuranceData && (
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
