import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Package, Plus, Upload, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface RecentShipmentsProps {
  shipments: any[];
}

export default function RecentShipments({ shipments }: RecentShipmentsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'shipped':
      case 'in_transit':
        return '🚚';
      case 'processing':
        return '📦';
      case 'returned':
        return '↩';
      default:
        return '●';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDestination = (toAddress: any) => {
    if (typeof toAddress === 'string') {
      try {
        toAddress = JSON.parse(toAddress);
      } catch {
        return 'Unknown Destination';
      }
    }
    
    if (!toAddress || typeof toAddress !== 'object') {
      return 'Unknown Destination';
    }

    const city = toAddress.city || '';
    const state = toAddress.state || '';
    return city && state ? `${city}, ${state}` : 'Unknown Destination';
  };

  const formatFromAddress = (fromAddress: any) => {
    if (typeof fromAddress === 'string') {
      try {
        fromAddress = JSON.parse(fromAddress);
      } catch {
        return 'Chilliwack, BC';
      }
    }
    
    if (!fromAddress || typeof fromAddress !== 'object') {
      return 'Chilliwack, BC';
    }

    const city = fromAddress.city || 'Chilliwack';
    const state = fromAddress.state || 'BC';
    return `${city}, ${state}`;
  };

  if (!shipments || shipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Shipments</CardTitle>
            <div className="flex space-x-2">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Shipment
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first shipment to start tracking your shipping activity.
            </p>
            <Link href="/create-shipment">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Shipment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Shipments</CardTitle>
          <div className="flex space-x-2">
            <Link href="/create-shipment">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Shipment
              </Button>
            </Link>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {shipments.slice(0, 10).map((shipment) => (
            <div key={shipment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(shipment.status)}`}>
                    <span className="text-sm font-medium">
                      {getStatusIcon(shipment.status)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {shipment.trackingNumber || `ABLP-${shipment.id.slice(-8)}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFromAddress(shipment.fromAddress)} → {formatDestination(shipment.toAddress)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${parseFloat(shipment.totalCost || '0').toFixed(2)} CAD
                    </p>
                    <Badge variant="secondary" className={getStatusColor(shipment.status)}>
                      {formatStatus(shipment.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">{shipment.carrierName}</p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/track?id=${shipment.id}`} className="flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Track Shipment
                        </Link>
                      </DropdownMenuItem>
                      {shipment.labelUrl && (
                        <DropdownMenuItem asChild>
                          <a 
                            href={shipment.labelUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            View Label
                          </a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {shipments.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Button variant="outline" className="w-full">
              View All Shipments
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
