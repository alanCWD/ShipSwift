import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import TrackingResults from '../components/tracking/tracking-results';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export default function TrackShipment() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedNumber, setSearchedNumber] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Track Your Shipment</h1>
          <p className="text-xl text-gray-600">Enter your tracking number to get real-time updates</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Track Package</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter tracking number (e.g., 1Z999AA1234567890)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                disabled={isLoading}
              >
                {isLoading ? 'Tracking...' : 'Track Package'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {trackingData && (
          <TrackingResults 
            shipment={trackingData.shipment}
            tracking={trackingData.tracking}
          />
        )}
      </div>
      
      <Footer />
    </div>
  );
}
