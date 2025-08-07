import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Truck, AlertTriangle, CheckCircle, DollarSign, Clock } from 'lucide-react';

export default function ShipTimeGuidelines() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2 text-blue-600" />
            ShipTime Environment Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Sandbox Guidelines */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-3">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                SANDBOX
              </Badge>
              <span className="ml-2 font-medium text-green-800">Testing Environment</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Special Instructions Required</p>
                  <p className="text-sm text-green-700">Add "Test booking Not for Pick up" to all shipments</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Use Drop-off Only</p>
                  <p className="text-sm text-green-700">Select Drop-off service, not Pick-up when testing rates</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Pick-up Date Management</p>
                  <p className="text-sm text-green-700">If testing pick-up, set date as far in future as possible</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Cancel Same-Day</p>
                  <p className="text-sm text-orange-700">ALL sandbox shipments must be cancelled same-day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Guidelines */}
          <div className="border rounded-lg p-4 bg-red-50">
            <div className="flex items-center mb-3">
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                PRODUCTION
              </Badge>
              <span className="ml-2 font-medium text-red-800">Live Environment</span>
            </div>
            
            <Alert className="mb-4 border-red-200 bg-red-50">
              <DollarSign className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> Production shipments incur real charges. Shippers are liable for all costs.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">No Test Shipments</p>
                  <p className="text-sm text-red-700">Do not create test shipments in production environment</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Drop-off for Rate Testing</p>
                  <p className="text-sm text-red-700">Use Drop-off service when only testing rates</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <DollarSign className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Carrier Charge Awareness</p>
                  <p className="text-sm text-red-700">
                    Nationex charges for missed pick-ups. Uber charges once driver is dispatched.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Truck className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Use ShipTime Account Credentials</p>
                  <p className="text-sm text-red-700">Production requires your actual ShipTime account login</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">API Endpoints</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sandbox:</span>
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">https://sandboxapi.shiptime.com/rest/</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Production:</span>
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">https://restapi.shiptime.com/rest/</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}