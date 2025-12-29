import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface BrandingData {
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

export default function BrandedTracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedNumber, setSearchedNumber] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Extract user ID and tracking number from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user');
    const trackingParam = urlParams.get('id');
    
    if (userIdParam) {
      setUserId(userIdParam);
    }
    if (trackingParam) {
      setTrackingNumber(trackingParam);
      setSearchedNumber(trackingParam);
    }
  }, []);

  // Load client branding
  const { data: brandingData } = useQuery({
    queryKey: ['/api/branding/public', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await apiRequest('GET', `/api/branding/public/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Load tracking data
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ['/api/shipments', searchedNumber, 'track'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shipments/${searchedNumber}/track`);
      return response.json();
    },
    enabled: !!searchedNumber,
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setSearchedNumber(trackingNumber.trim());
    }
  };

  // Use client branding or fallback to GoABLP defaults
  const branding: BrandingData = brandingData || {
    companyName: 'GoABLP',
    primaryColor: '#1E40AF',
    secondaryColor: '#6B7280',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    trackingPageTitle: 'Track Your Shipment',
    trackingPageDescription: 'Enter your tracking number to get real-time updates',
    supportPhone: '(604) 392-3923',
    supportEmail: 'support@goablp.com',
    footerText: '© 2025 GoABLP - Subsidiary of ABLP Logistics. All rights reserved.',
  };

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
      address.streetAddress,
      address.city,
      address.state,
      address.postalCode,
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  };

  const shipment = trackingData?.shipment;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: branding.backgroundColor,
        color: branding.textColor 
      }}
    >
      {/* Branded Header */}
      <div 
        className="shadow-sm border-b"
        style={{ 
          backgroundColor: branding.primaryColor,
          color: '#FFFFFF'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.companyName}
                className="h-12 mx-auto mb-4"
              />
            ) : (
              <div className="text-2xl font-bold mb-2">
                {branding.companyName}
              </div>
            )}
            <h1 className="text-xl font-semibold">{branding.trackingPageTitle}</h1>
            {branding.trackingPageDescription && (
              <p className="mt-2 opacity-90">{branding.trackingPageDescription}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tracking Form */}
        <Card className="mb-8" style={{ borderColor: branding.secondaryColor }}>
          <CardHeader>
            <CardTitle style={{ color: branding.primaryColor }}>Track Package</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: branding.textColor }}
                >
                  Tracking Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full text-lg py-3"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  color: '#FFFFFF'
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Tracking...' : 'Track Package'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Tracking Results */}
        {shipment && (
          <div className="space-y-6">
            {/* Shipment Overview */}
            <Card style={{ borderColor: branding.secondaryColor }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle 
                    className="flex items-center"
                    style={{ color: branding.primaryColor }}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Tracking Results
                  </CardTitle>
                  <Badge className={getStatusColor(shipment.status)}>
                    {React.createElement(getStatusIcon(shipment.status), { className: "w-4 h-4 mr-1" })}
                    {formatStatus(shipment.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: branding.textColor }}
                    >
                      Shipment Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: branding.secondaryColor }}>Tracking Number:</span>
                        <span className="font-medium">{shipment.trackingNumber || `TRACK-${shipment.id.slice(-8)}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: branding.secondaryColor }}>Carrier:</span>
                        <span className="font-medium">{shipment.carrierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: branding.secondaryColor }}>Service:</span>
                        <span className="font-medium">{shipment.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: branding.secondaryColor }}>Cost:</span>
                        <span className="font-medium">${parseFloat(shipment.totalCost || '0').toFixed(2)} CAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: branding.secondaryColor }}>Created:</span>
                        <span className="font-medium">{format(new Date(shipment.createdAt), 'MMM dd, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 
                      className="font-semibold mb-2"
                      style={{ color: branding.textColor }}
                    >
                      Addresses
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p 
                          className="font-medium flex items-center mb-1"
                          style={{ color: branding.secondaryColor }}
                        >
                          <MapPin className="w-3 h-3 mr-1" style={{ color: branding.primaryColor }} />
                          From:
                        </p>
                        <p className="ml-4" style={{ color: branding.textColor }}>{formatAddress(shipment.fromAddress)}</p>
                      </div>
                      <div>
                        <p 
                          className="font-medium flex items-center mb-1"
                          style={{ color: branding.secondaryColor }}
                        >
                          <MapPin className="w-3 h-3 mr-1" style={{ color: branding.primaryColor }} />
                          To:
                        </p>
                        <p className="ml-4" style={{ color: branding.textColor }}>{formatAddress(shipment.toAddress)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branded Footer */}
            <Card 
              style={{ 
                backgroundColor: `${branding.primaryColor}10`,
                borderColor: branding.primaryColor
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  {branding.logoUrl ? (
                    <img 
                      src={branding.logoUrl} 
                      alt={branding.companyName}
                      className="h-8"
                    />
                  ) : (
                    <span 
                      className="text-xl font-bold"
                      style={{ color: branding.primaryColor }}
                    >
                      {branding.companyName}
                    </span>
                  )}
                </div>
                <p 
                  className="mb-4"
                  style={{ color: branding.secondaryColor }}
                >
                  Thank you for choosing {branding.companyName} for your shipping needs.
                </p>
                <div 
                  className="flex justify-center space-x-4 text-sm"
                  style={{ color: branding.secondaryColor }}
                >
                  {branding.supportPhone && (
                    <span>📞 {branding.supportPhone}</span>
                  )}
                  {branding.supportEmail && (
                    <span>✉️ {branding.supportEmail}</span>
                  )}
                </div>
                {branding.footerText && (
                  <p 
                    className="mt-4 text-xs"
                    style={{ color: branding.secondaryColor }}
                  >
                    {branding.footerText}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}