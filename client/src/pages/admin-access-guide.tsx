import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, TrendingUp, Key, Truck, Building, AlertTriangle, CheckCircle, ArrowRight, Globe, TestTube, DollarSign, Clock, Info } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminAccessGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">GoABLP Admin Access Guide</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Complete guide to accessing and using the GoABLP admin control center
          </p>
        </div>

        <div className="space-y-6">
          {/* Access Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Admin Access Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>GoABLP Internal Use Only:</strong> Admin access is restricted to GoABLP staff and authorized personnel only.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-green-800">Required Permissions</h4>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• User account with <Badge variant="outline">admin</Badge> role</li>
                    <li>• Valid GoABLP employee status</li>
                    <li>• Platform management authorization</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-blue-800">Current Admin Users</h4>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• alan@citywidedigital.ca</li>
                    <li>• Additional admins can be configured</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="w-5 h-5 mr-2" />
                How to Access Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Step-by-Step Access:</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</div>
                    <div>
                      <p className="font-medium">Log in with Admin Account</p>
                      <p className="text-sm text-gray-600">Use an account with admin role (e.g., alan@citywidedigital.ca)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</div>
                    <div>
                      <p className="font-medium">Look for "GoABLP Admin" Button</p>
                      <p className="text-sm text-gray-600">Orange button appears in the navigation bar for admin users only</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</div>
                    <div>
                      <p className="font-medium">Click "GoABLP Admin"</p>
                      <p className="text-sm text-gray-600">Redirects to /admin with full platform controls</p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  If you don't see the "GoABLP Admin" button, your account may not have admin permissions. Contact system administrator.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Admin Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Admin Panel Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Truck className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="font-medium">ShipTime API Settings</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Configure API credentials</li>
                      <li>• Switch between production/sandbox</li>
                      <li>• Test API connectivity</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Building className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-medium">Company Settings</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Update company information</li>
                      <li>• Configure default markups</li>
                      <li>• Platform feature toggles</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                      <h4 className="font-medium">Advanced Markup Rules</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Conditional pricing logic</li>
                      <li>• Cost/weight-based rules</li>
                      <li>• Geographic targeting</li>
                      <li>• Priority management</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-medium">System Monitoring</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• API connection status</li>
                      <li>• Payment processing health</li>
                      <li>• Platform configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ShipTime API Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                ShipTime API Environment Guidelines
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
                
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <TestTube className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>API Endpoint:</strong> https://sandboxapi.shiptime.com/rest/
                  </AlertDescription>
                </Alert>
                
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
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Auto-Cancellation</p>
                      <p className="text-sm text-green-700">ALL sandbox shipments are automatically cancelled immediately to prevent charges</p>
                    </div>
                  </div>

                  <div className="bg-green-100 border border-green-200 rounded p-3 mt-3">
                    <p className="text-sm text-green-800"><strong>Sandbox Credentials:</strong></p>
                    <p className="text-xs text-green-700 font-mono">Username: alan@citywidedigital.ca</p>
                    <p className="text-xs text-green-700 font-mono">Password: Password123!</p>
                    <p className="text-xs text-green-700">Provided by ShipTime support for development testing</p>
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
                  <Globe className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>API Endpoint:</strong> https://restapi.shiptime.com/rest/
                  </AlertDescription>
                </Alert>

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
                    <Key className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Use ShipTime Account Credentials</p>
                      <p className="text-sm text-red-700">Production requires your actual ShipTime account login</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Go to Admin Panel
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link href="/dashboard">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> All ShipTime API guidelines and automation are built into the system. The admin panel includes a dedicated "Guidelines" tab with complete environment-specific requirements.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}