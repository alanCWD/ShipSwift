import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cannabis, Package, ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { Link } from "wouter";

export default function BlazeOrders() {
  const { user } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['/api/shipments'],
    enabled: !!user,
  });

  if (!user?.blazeAccess && user?.role !== 'admin' && user?.role !== 'ablp_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Cannabis className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Access Required</h2>
              <p>You need Blaze Portal access to view orders.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-600">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-600">Shipped</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/blaze">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Cannabis className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Blaze Orders</h1>
            <p className="text-muted-foreground">Your cannabis shipment history</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              All shipments created through the Blaze Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : shipments && shipments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment: any) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">
                        {shipment.trackingNumber || '-'}
                      </TableCell>
                      <TableCell>{shipment.carrierName}</TableCell>
                      <TableCell>{shipment.serviceName}</TableCell>
                      <TableCell>
                        {shipment.toAddress?.city}, {shipment.toAddress?.state}
                      </TableCell>
                      <TableCell>{formatCurrency(shipment.totalCost)}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No shipments found</p>
                <Link href="/blaze/ship">
                  <Button>Create Your First Shipment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
