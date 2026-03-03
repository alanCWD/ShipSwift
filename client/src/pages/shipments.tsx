import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Package, ArrowLeft, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Shipments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiRequest('POST', `/api/shipments/${shipmentId}/cancel`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Shipment Cancelled",
        description: "The shipment has been successfully cancelled.",
      });
      // Invalidate queries to refresh the shipments list
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel shipment",
        variant: "destructive",
      });
    },
  });

  const handleCancelShipment = async (shipmentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to cancel this shipment? This action cannot be undone.')) {
      cancelMutation.mutate(shipmentId);
    }
  };

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['/api/shipments'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/shipments');
      return response.json();
    },
  });

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
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatFromAddress = (address: any) => {
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        return 'Invalid address';
      }
    }
    return address?.city || 'Unknown';
  };

  const formatDestination = (address: any) => {
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        return 'Invalid address';
      }
    }
    return address?.city || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const shipments = shipmentsData?.shipments || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Shipments</h1>
              <p className="text-gray-600 mt-2">
                View and manage all your shipments
              </p>
            </div>
            <Link href="/create-shipment">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Shipment
              </Button>
            </Link>
          </div>
        </div>

        {/* Shipments List */}
        <Card>
          <CardHeader>
            <CardTitle>Shipments ({shipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first shipment to get started
                </p>
                <Link href="/create-shipment">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Shipment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {shipments.map((shipment: any) => (
                  <div key={shipment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {shipment.trackingNumber || `SW-${shipment.id.slice(-8)}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatFromAddress(shipment.fromAddress)} → {formatDestination(shipment.toAddress)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {shipment.carrierName} - {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${parseFloat(shipment.totalCost || '0').toFixed(2)} CAD
                          </p>
                          <Badge variant="secondary" className={getStatusColor(shipment.status)}>
                            {formatStatus(shipment.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link href={`/track?id=${shipment.id}`}>
                            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Track
                            </Button>
                          </Link>
                          {shipment.labelUrl && shipment.status !== 'cancelled' && (
                            <a 
                              href={`/api/shipments/${shipment.id}/label`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-800">
                                <Package className="w-4 h-4 mr-1" />
                                Label
                              </Button>
                            </a>
                          )}
                          {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={(e) => handleCancelShipment(shipment.id, e)}
                              disabled={cancelMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}