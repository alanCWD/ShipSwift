import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Clock, CheckCircle, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import ShipmentMap from './shipment-map';

interface TrackingResultsProps {
  shipment: any;
  tracking?: any;
}

export default function TrackingResults({ shipment, tracking }: TrackingResultsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
      case 'in_transit':
        return Truck;
      case 'processing':
        return Package;
      case 'returned':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        return 'Address not available';
      }
    }
    
    if (!address || typeof address !== 'object') {
      return 'Address not available';
    }

    const parts = [
      address.street,
      address.city,
      address.province || address.state,
      address.postalCode || address.zipCode,
      address.country
    ].filter(Boolean);

    return parts.join(', ') || 'Address not available';
  };

  const generateTrackingEvents = () => {
    const events = [];
    const statusDate = new Date(shipment.createdAt);
    
    // Always add initial processing event
    events.push({
      status: 'Order Processed',
      location: 'GoABLP Facility, Canada',
      timestamp: statusDate.toISOString(),
      description: 'Package received and processed for shipping',
      isCompleted: true,
    });

    // Add pickup event if shipped
    if (['shipped', 'in_transit', 'delivered'].includes(shipment.status)) {
      const pickupDate = new Date(statusDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      events.push({
        status: 'Picked Up',
        location: 'Origin Facility',
        timestamp: pickupDate.toISOString(),
        description: `Package picked up by ${shipment.carrierName || 'carrier'}`,
        isCompleted: true,
      });
    }

    // Add in transit events
    if (['shipped', 'in_transit', 'delivered'].includes(shipment.status)) {
      const transitDate = new Date(statusDate.getTime() + 6 * 60 * 60 * 1000); // 6 hours later
      events.push({
        status: 'In Transit',
        location: 'Sorting Facility',
        timestamp: transitDate.toISOString(),
        description: 'Package is being transported',
        isCompleted: shipment.status !== 'shipped',
      });
    }

    // Add out for delivery if delivered
    if (shipment.status === 'delivered') {
      const deliveryDate = new Date(statusDate.getTime() + 24 * 60 * 60 * 1000); // 1 day later
      events.push({
        status: 'Out for Delivery',
        location: 'Local Delivery Hub',
        timestamp: deliveryDate.toISOString(),
        description: 'Package is out for delivery',
        isCompleted: true,
      });

      events.push({
        status: 'Delivered',
        location: 'Destination Address',
        timestamp: new Date(deliveryDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        description: 'Package successfully delivered',
        isCompleted: true,
      });
    } else {
      // Add expected delivery for non-delivered packages
      const destinationCity = shipment.toAddress?.city || 'Destination';
      events.push({
        status: 'Expected Delivery',
        location: destinationCity,
        timestamp: null,
        description: 'Package on route to destination',
        isCompleted: false,
      });
    }

    return events;
  };

  const trackingEvents = tracking?.events || generateTrackingEvents();

  const StatusIcon = getStatusIcon(shipment.status);

  return (
    <div className="space-y-6">
      {/* Shipment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Tracking Results
            </CardTitle>
            <Badge className={getStatusColor(shipment.status)}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {formatStatus(shipment.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Shipment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="font-medium">{shipment.trackingNumber || `SW-${shipment.id.slice(-8)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier:</span>
                  <span className="font-medium">{shipment.carrierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{shipment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">${parseFloat(shipment.totalCost || '0').toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{format(new Date(shipment.createdAt), 'MMM dd, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Addresses</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 font-medium flex items-center mb-1">
                    <MapPin className="w-3 h-3 mr-1 text-blue-600" />
                    From:
                  </p>
                  <p className="text-gray-900 ml-4">{formatAddress(shipment.fromAddress)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium flex items-center mb-1">
                    <MapPin className="w-3 h-3 mr-1 text-green-600" />
                    To:
                  </p>
                  <p className="text-gray-900 ml-4">{formatAddress(shipment.toAddress)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {shipment.labelUrl && (
            <div className="pt-4">
              <Button asChild variant="outline">
                <a href={`/api/shipments/${shipment.id}/label`} target="_blank" rel="noopener noreferrer">
                  <Package className="w-4 h-4 mr-2" />
                  View Shipping Label
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Visualization */}
      <ShipmentMap 
        fromAddress={shipment.fromAddress}
        toAddress={shipment.toAddress}
        status={shipment.status}
      />

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {trackingEvents.map((event: any, index: number) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                  event.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {event.isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <div className="w-3 h-3 bg-current rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${event.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {event.status}
                    </p>
                    {event.timestamp && (
                      <p className="text-sm text-gray-500">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                  <p className={`text-sm ${event.isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                    {event.location}
                  </p>
                  {event.description && (
                    <p className={`text-sm ${event.isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GoABLP Branded Footer */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-xl">
              GoABLP
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Thank you for choosing GoABLP for your shipping needs.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <span>📍 44322 Yale Rd #3, Chilliwack, BC</span>
            <span>📞 (604) 392-3923</span>
            <span>✉️ support@goablp.com</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}