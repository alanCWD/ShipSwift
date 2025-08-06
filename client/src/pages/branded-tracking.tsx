import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Truck, MapPin, Calendar, Clock, Phone, Mail } from 'lucide-react';

interface ClientBranding {
  id: string;
  userId: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  trackingPageTitle: string;
  trackingPageDescription?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingData {
  trackingNumber: string;
  status: string;
  carrier: string;
  service: string;
  estimatedDelivery?: string;
  origin: string;
  destination: string;
  events: TrackingEvent[];
}

export default function BrandedTracking() {
  const [location] = useLocation();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedNumber, setSearchedNumber] = useState('');
  
  // Extract client ID and tracking number from URL
  // URL format: /track/:clientId/:trackingNumber or /track/:clientId
  const pathParts = location.split('/').filter(Boolean);
  const clientId = pathParts[1]; // track/CLIENT_ID/...
  const urlTrackingNumber = pathParts[2]; // track/CLIENT_ID/TRACKING_NUMBER
  
  useEffect(() => {
    if (urlTrackingNumber) {
      setTrackingNumber(urlTrackingNumber);
      setSearchedNumber(urlTrackingNumber);
    }
  }, [urlTrackingNumber]);

  // Load client branding
  const { data: branding } = useQuery({
    queryKey: [`/api/branding/public/${clientId}`],
    enabled: !!clientId,
  });

  // Load tracking data
  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: [`/api/shipments/track/public/${searchedNumber}`],
    enabled: !!searchedNumber,
  });

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      setSearchedNumber(trackingNumber.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'out for delivery':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dynamicStyles = branding ? {
    '--primary-color': branding.primaryColor,
    '--secondary-color': branding.secondaryColor,
    '--background-color': branding.backgroundColor,
    '--text-color': branding.textColor,
  } as React.CSSProperties : {};

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: branding?.backgroundColor || '#ffffff',
        color: branding?.textColor || '#000000',
        ...dynamicStyles
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header with branding */}
        <div className="text-center mb-8">
          {branding?.logoUrl && (
            <img 
              src={branding.logoUrl} 
              alt={branding.companyName || 'Company Logo'} 
              className="mx-auto mb-4 max-h-20 object-contain"
            />
          )}
          
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: branding?.primaryColor || '#007bff' }}
          >
            {branding?.trackingPageTitle || 'Track Your Shipment'}
          </h1>
          
          {branding?.trackingPageDescription && (
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              {branding.trackingPageDescription}
            </p>
          )}
        </div>

        {/* Search Section */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={!trackingNumber.trim()}
                style={{ backgroundColor: branding?.primaryColor || '#007bff' }}
              >
                <Package className="w-4 h-4 mr-2" />
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {searchedNumber && (
          <div className="max-w-4xl mx-auto">
            {trackingLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                         style={{ borderColor: branding?.primaryColor || '#007bff' }} />
                    <span className="ml-3">Loading tracking information...</span>
                  </div>
                </CardContent>
              </Card>
            ) : trackingData ? (
              <>
                {/* Shipment Summary */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Tracking #{trackingData.trackingNumber}</span>
                      <Badge className={getStatusColor(trackingData.status)}>
                        {trackingData.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 opacity-60" />
                        <div>
                          <div className="font-medium">{trackingData.carrier}</div>
                          <div className="text-sm opacity-60">{trackingData.service}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 opacity-60" />
                        <div>
                          <div className="font-medium">Origin</div>
                          <div className="text-sm opacity-60">{trackingData.origin}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 opacity-60" />
                        <div>
                          <div className="font-medium">Destination</div>
                          <div className="text-sm opacity-60">{trackingData.destination}</div>
                        </div>
                      </div>
                      
                      {trackingData.estimatedDelivery && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 opacity-60" />
                          <div>
                            <div className="font-medium">Est. Delivery</div>
                            <div className="text-sm opacity-60">{trackingData.estimatedDelivery}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trackingData.events.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: branding?.primaryColor || '#007bff' }}
                            />
                            {index < trackingData.events.length - 1 && (
                              <div className="w-px h-12 bg-gray-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-4 mb-1">
                              <span className="font-medium">{event.status}</span>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {event.date}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </Badge>
                            </div>
                            <div className="text-sm opacity-80 mb-1">{event.description}</div>
                            <div className="text-sm opacity-60 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto opacity-40 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Tracking number not found</h3>
                    <p className="opacity-60 mb-4">
                      Please check your tracking number and try again, or contact support if you need assistance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Support Information */}
        {branding && (branding.supportEmail || branding.supportPhone) && (
          <div className="mt-12 pt-8 border-t">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Need Help?</h3>
              <div className="flex justify-center items-center gap-6 flex-wrap">
                {branding.supportEmail && (
                  <a 
                    href={`mailto:${branding.supportEmail}`}
                    className="flex items-center gap-2 hover:underline"
                    style={{ color: branding.primaryColor }}
                  >
                    <Mail className="w-4 h-4" />
                    {branding.supportEmail}
                  </a>
                )}
                {branding.supportPhone && (
                  <a 
                    href={`tel:${branding.supportPhone}`}
                    className="flex items-center gap-2 hover:underline"
                    style={{ color: branding.primaryColor }}
                  >
                    <Phone className="w-4 h-4" />
                    {branding.supportPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {branding?.footerText && (
          <footer className="mt-8 pt-6 border-t text-center">
            <p className="text-sm opacity-60">{branding.footerText}</p>
          </footer>
        )}
      </div>
    </div>
  );
}