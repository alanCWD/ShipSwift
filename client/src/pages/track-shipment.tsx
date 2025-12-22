import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import TrackingResults from '../components/tracking/tracking-results';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { RefreshCw, Bell, Clock } from 'lucide-react';

export default function TrackShipment() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedNumber, setSearchedNumber] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam) {
      setTrackingNumber(idParam);
      setSearchedNumber(idParam);
    }
  }, []);

  const { data: trackingData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['/api/shipments', searchedNumber, 'track'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shipments/${searchedNumber}/track`);
      const data = await response.json();
      setLastUpdated(new Date());
      return data;
    },
    enabled: !!searchedNumber,
    refetchInterval: autoRefresh && searchedNumber ? 30000 : false,
    refetchIntervalInBackground: false,
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setSearchedNumber(trackingNumber.trim());
    }
  };

  const handleManualRefresh = () => {
    refetch();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">Track Your Shipment</h1>
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
                  data-testid="input-tracking-number"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                disabled={isLoading}
                data-testid="button-track"
              >
                {isLoading ? 'Tracking...' : 'Track Package'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searchedNumber && trackingData && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                      data-testid="switch-auto-refresh"
                    />
                    <Label htmlFor="auto-refresh" className="text-sm">
                      Auto-refresh every 30s
                    </Label>
                  </div>
                  
                  {autoRefresh && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Bell className="w-3 h-3 mr-1" />
                      Live Updates
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {lastUpdated && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Updated: {formatLastUpdated()}
                    </span>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isFetching}
                    data-testid="button-refresh"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
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
