import Navbar from '../components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, TrendingUp, Key, Truck, Building, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminAccessGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">ABLP Admin Access Guide</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Complete guide to accessing and using the ABLP Logistics admin control center
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
                  <strong>ABLP Internal Use Only:</strong> Admin access is restricted to ABLP Logistics staff and authorized personnel only.
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
                    <li>• Valid ABLP employee status</li>
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
                      <p className="font-medium">Look for "ABLP Admin" Button</p>
                      <p className="text-sm text-gray-600">Orange button appears in the navigation bar for admin users only</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</div>
                    <div>
                      <p className="font-medium">Click "ABLP Admin"</p>
                      <p className="text-sm text-gray-600">Redirects to /admin with full platform controls</p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  If you don't see the "ABLP Admin" button, your account may not have admin permissions. Contact system administrator.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}