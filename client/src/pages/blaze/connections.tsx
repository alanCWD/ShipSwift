import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Cannabis, Link2, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { Link } from "wouter";

interface BlazeConnection {
  id: string;
  dispensaryName: string;
  dispensaryId: string;
  isActive: boolean;
  syncStatus: string;
  syncErrorMessage?: string;
  totalOrders: number;
  totalShipments: number;
  createdAt: string;
}

export default function BlazeConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dispensaryName, setDispensaryName] = useState('');
  const [dispensaryApiKey, setDispensaryApiKey] = useState('');

  const { data: connections, isLoading } = useQuery<BlazeConnection[]>({
    queryKey: ['/api/blaze/connections'],
    enabled: !!user?.blazeAccess || user?.role === 'admin' || user?.role === 'ablp_admin',
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: { dispensaryName: string; dispensaryApiKey: string }) => {
      return await apiRequest('/api/blaze/connections', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dispensary connection created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blaze/connections'] });
      setIsDialogOpen(false);
      setDispensaryName('');
      setDispensaryApiKey('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection.",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/blaze/connections/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Connection deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blaze/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete connection.",
        variant: "destructive",
      });
    },
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
              <p>You need Blaze Portal access to manage connections.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateConnection = () => {
    if (!dispensaryName || !dispensaryApiKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createConnectionMutation.mutate({ dispensaryName, dispensaryApiKey });
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

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Cannabis className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold">Dispensary Connections</h1>
              <p className="text-muted-foreground">Manage your Blaze dispensary integrations</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-connection">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Dispensary</DialogTitle>
                <DialogDescription>
                  Enter your Blaze dispensary API key to connect your account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="dispensaryName">Dispensary Name</Label>
                  <Input
                    id="dispensaryName"
                    placeholder="My Dispensary"
                    value={dispensaryName}
                    onChange={(e) => setDispensaryName(e.target.value)}
                    data-testid="input-dispensary-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispensaryApiKey">Dispensary API Key</Label>
                  <Input
                    id="dispensaryApiKey"
                    type="password"
                    placeholder="Enter your Blaze API key"
                    value={dispensaryApiKey}
                    onChange={(e) => setDispensaryApiKey(e.target.value)}
                    data-testid="input-dispensary-api-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your Blaze dashboard under Global Settings &gt; Developer Keys
                  </p>
                </div>
                <Button 
                  onClick={handleCreateConnection}
                  disabled={createConnectionMutation.isPending}
                  className="w-full"
                  data-testid="button-create-connection"
                >
                  {createConnectionMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
                  ) : (
                    'Connect Dispensary'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Connected Dispensaries
            </CardTitle>
            <CardDescription>
              Dispensaries linked to your GoABLP account for shipping
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : connections && connections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispensary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-center">Shipments</TableHead>
                    <TableHead>Connected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">{connection.dispensaryName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          connection.syncStatus === 'connected' ? 'default' :
                          connection.syncStatus === 'error' ? 'destructive' : 'secondary'
                        }>
                          {connection.syncStatus}
                        </Badge>
                        {connection.syncErrorMessage && (
                          <p className="text-xs text-red-500 mt-1">{connection.syncErrorMessage}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{connection.totalOrders}</TableCell>
                      <TableCell className="text-center">{connection.totalShipments}</TableCell>
                      <TableCell>
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteConnectionMutation.mutate(connection.id)}
                          disabled={deleteConnectionMutation.isPending}
                          data-testid={`button-delete-connection-${connection.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No dispensaries connected yet</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Connection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
