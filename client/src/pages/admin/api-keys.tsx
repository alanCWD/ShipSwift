import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface MerchantApiKey {
  id: string;
  userId: string;
  keyPrefix: string; // First 12 chars for display
  hashedApiKey: string; // Bcrypt hash - never displayed
  name: string;
  description: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  requestCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatedApiKeyResponse extends MerchantApiKey {
  apiKey?: string; // Plaintext key, only returned once at creation
  warning?: string;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showCreatedKeyDialog, setShowCreatedKeyDialog] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery<MerchantApiKey[]>({
    queryKey: ['/api/merchant/keys'],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest('POST', '/api/merchant/keys', data);
      return await res.json() as CreatedApiKeyResponse;
    },
    onSuccess: (data: CreatedApiKeyResponse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/keys'] });
      setIsCreateDialogOpen(false);
      setNewKeyName('');
      setNewKeyDescription('');
      
      // Show the newly created key in a dialog
      if (data.apiKey) {
        setNewlyCreatedKey(data.apiKey);
        setShowCreatedKeyDialog(true);
      }
      
      toast({
        title: 'API Key Created',
        description: 'Your new API key has been generated successfully. Make sure to copy it now!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive',
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/merchant/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/keys'] });
      toast({
        title: 'API Key Deleted',
        description: 'The API key has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest('PUT', `/api/merchant/keys/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/keys'] });
      toast({
        title: 'API Key Updated',
        description: 'The API key status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API key',
        variant: 'destructive',
      });
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }
    createKeyMutation.mutate({
      name: newKeyName,
      description: newKeyDescription,
    });
  };

  const handleCopyKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(apiKey);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="w-8 h-8" />
            Merchant API Keys
          </h1>
          <p className="text-gray-600 mt-2">
            Manage API keys for external integrations like WooCommerce
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-api-key">
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for external integrations. Make sure to copy and save it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., My WooCommerce Store"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  data-testid="input-api-key-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about where this key will be used"
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  data-testid="input-api-key-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                data-testid="button-confirm-create-key"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Key className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No API keys yet</p>
              <p className="text-sm">Create your first API key to integrate with external platforms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id} data-testid={`row-api-key-${key.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{key.name}</div>
                          {key.description && (
                            <div className="text-sm text-gray-500">{key.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">
                            {key.keyPrefix}••••••••••••••••
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            (Hidden)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{key.requestCount} requests</span>
                      </TableCell>
                      <TableCell>
                        {key.lastUsedAt ? (
                          <span className="text-sm">
                            {format(new Date(key.lastUsedAt), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(key.createdAt), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleKeyMutation.mutate({
                                id: key.id,
                                isActive: !key.isActive,
                              })
                            }
                            data-testid={`button-toggle-${key.id}`}
                          >
                            {key.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-${key.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this API key? This action cannot be
                                  undone and will immediately disable access for any integrations using
                                  this key.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteKeyMutation.mutate(key.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">WooCommerce Integration</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Download and install the GoABLP WooCommerce plugin</li>
              <li>Copy your API key from the table above</li>
              <li>In WordPress admin, go to WooCommerce → Settings → Shipping → GoABLP</li>
              <li>Paste your API key and save settings</li>
              <li>Configure your shipping zones and enable the GoABLP shipping method</li>
            </ol>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">API Endpoint</h4>
            <code className="text-xs bg-white px-2 py-1 rounded border">
              POST {window.location.origin}/api/v1/merchant/rates
            </code>
            <p className="text-xs text-gray-600 mt-2">
              Include your API key in the Authorization header as: <code>Bearer YOUR_API_KEY</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog to show newly created API key (only shown once) */}
      <Dialog open={showCreatedKeyDialog} onOpenChange={setShowCreatedKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              <span className="text-red-600 font-semibold">⚠️ Important: </span>
              Save this API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-mono break-all bg-white p-3 rounded border">
                {newlyCreatedKey}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => newlyCreatedKey && handleCopyKey(newlyCreatedKey)}
                data-testid="button-copy-new-key"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <p className="text-xs text-gray-700">
                <strong>Next steps:</strong>
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li>Save this key in a secure location</li>
                <li>Use it in your WooCommerce plugin or API integrations</li>
                <li>Never share it publicly or commit it to version control</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatedKeyDialog(false);
                setNewlyCreatedKey(null);
              }}
              data-testid="button-close-new-key-dialog"
            >
              I've saved the key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
