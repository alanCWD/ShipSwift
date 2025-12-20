import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Cannabis, Package, Truck, Link2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/navbar";

export default function BlazeDashboard() {
  const { user } = useAuth();

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/blaze/connections'],
    enabled: !!user?.blazeAccess || user?.role === 'admin' || user?.role === 'ablp_admin',
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p>You need to be logged in to access the Blaze Portal.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user.blazeAccess && user.role !== 'admin' && user.role !== 'ablp_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Cannabis className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Blaze Portal Access Required</h2>
              <p className="text-muted-foreground mb-4">
                You don't have access to the Blaze Portal. Please contact an administrator to request access.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Cannabis className="h-10 w-10 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Blaze Portal</h1>
            <p className="text-muted-foreground">Cannabis dispensary shipping integration</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Create Shipment
              </CardTitle>
              <CardDescription>
                Ship products using cannabis-friendly carriers only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/blaze/ship">
                <Button className="w-full" data-testid="button-create-blaze-shipment">
                  New Shipment <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Order History
              </CardTitle>
              <CardDescription>
                View and track your Blaze shipments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/blaze/orders">
                <Button variant="outline" className="w-full" data-testid="button-view-blaze-orders">
                  View Orders <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Dispensary Connections
              </CardTitle>
              <CardDescription>
                Manage your Blaze dispensary integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/blaze/connections">
                <Button variant="outline" className="w-full" data-testid="button-manage-connections">
                  Manage <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <ShieldCheck className="h-5 w-5" />
              Cannabis-Compliant Shipping
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-600 dark:text-green-400">
            <p>
              The Blaze Portal automatically filters out carriers with cannabis restrictions. 
              Only Canadian carriers like Canada Post, Purolator, Canpar, GLS, and Loomis are available 
              for your dispensary shipments.
            </p>
          </CardContent>
        </Card>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : connections && connections.length > 0 ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Connected Dispensaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {connections.map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{conn.dispensaryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {conn.totalShipments} shipments
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      conn.syncStatus === 'connected' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {conn.syncStatus}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
