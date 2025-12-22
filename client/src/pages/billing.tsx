import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Receipt, Download, Search, Calendar as CalendarIcon, Package, FileText, Loader2, Printer, Building, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  trackingNumber: string | null;
  carrierName: string;
  serviceName: string;
  fromAddress: any;
  toAddress: any;
  baseCost: string;
  markupCost: string;
  totalCost: string;
  taxAmount: string | null;
  status: string;
  stripeChargeId: string | null;
  createdAt: string;
  shipmentType: string;
  packageDetails: any;
}

export default function Billing() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Build URL with query parameters
  const buildInvoicesUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    const queryString = params.toString();
    return queryString ? `/api/billing/invoices?${queryString}` : '/api/billing/invoices';
  };

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/billing/invoices', { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }],
    queryFn: async () => {
      const response = await fetch(buildInvoicesUrl(), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
  });

  // Client-side search filtering (more responsive for search)
  const filteredInvoices = invoices?.filter(invoice => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.trackingNumber?.toLowerCase().includes(query) ||
        invoice.carrierName.toLowerCase().includes(query) ||
        invoice.serviceName.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="text-gray-600">View your payment history and download invoices</p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by tracking number or carrier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-invoices"
                  />
                </div>
              </div>
              
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(searchQuery || startDate || endDate) && (
                <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice History
            </CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading invoices...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
                <p className="text-sm">Your completed shipments will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell>
                        {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        INV-{invoice.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.trackingNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.carrierName}</p>
                          <p className="text-sm text-gray-500">{invoice.serviceName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.totalCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          data-testid={`button-view-invoice-${invoice.id}`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:h-auto print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice for shipment {selectedInvoice?.trackingNumber || selectedInvoice?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6" id="invoice-content">
              <div className="bg-white p-6 border rounded-lg print:border-none">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">GoABLP</h2>
                    <p className="text-sm text-gray-500">ABLP Logistics</p>
                    <p className="text-sm text-gray-500">Canadian Shipping Solutions</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">INVOICE</h3>
                    <p className="text-sm font-mono">INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">
                      Date: {format(new Date(selectedInvoice.createdAt), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">BILL TO</h4>
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    {user?.companyName && <p className="text-sm">{user.companyName}</p>}
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">SHIPMENT DETAILS</h4>
                    <p className="text-sm">
                      <span className="text-gray-500">Tracking:</span> {selectedInvoice.trackingNumber || 'Pending'}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Carrier:</span> {selectedInvoice.carrierName}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Service:</span> {selectedInvoice.serviceName}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Type:</span> {selectedInvoice.shipmentType}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">FROM</h4>
                    {selectedInvoice.fromAddress && (
                      <div className="text-sm">
                        <p>{selectedInvoice.fromAddress.attention || selectedInvoice.fromAddress.name}</p>
                        <p>{selectedInvoice.fromAddress.street || selectedInvoice.fromAddress.address}</p>
                        <p>
                          {selectedInvoice.fromAddress.city}, {selectedInvoice.fromAddress.province} {selectedInvoice.fromAddress.postalCode}
                        </p>
                        <p>{selectedInvoice.fromAddress.country || 'Canada'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">TO</h4>
                    {selectedInvoice.toAddress && (
                      <div className="text-sm">
                        <p>{selectedInvoice.toAddress.attention || selectedInvoice.toAddress.name}</p>
                        <p>{selectedInvoice.toAddress.street || selectedInvoice.toAddress.address}</p>
                        <p>
                          {selectedInvoice.toAddress.city}, {selectedInvoice.toAddress.province} {selectedInvoice.toAddress.postalCode}
                        </p>
                        <p>{selectedInvoice.toAddress.country || 'Canada'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="mb-8">
                  <h4 className="font-semibold text-sm text-gray-500 mb-4">CHARGES</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <p className="font-medium">{selectedInvoice.carrierName} - {selectedInvoice.serviceName}</p>
                            <p className="text-sm text-gray-500">
                              {selectedInvoice.shipmentType === 'envelope' ? 'Envelope' : 
                               selectedInvoice.shipmentType === 'pallet' ? 'Pallet/Freight' : 'Package'} Shipment
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(selectedInvoice.baseCost)}</TableCell>
                      </TableRow>
                      {parseFloat(selectedInvoice.markupCost || '0') > 0 && (
                        <TableRow>
                          <TableCell>Service Fee</TableCell>
                          <TableCell className="text-right">{formatCurrency(selectedInvoice.markupCost)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell>Subtotal</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(selectedInvoice.baseCost) + parseFloat(selectedInvoice.markupCost || '0'))}
                        </TableCell>
                      </TableRow>
                      {selectedInvoice.taxAmount && parseFloat(selectedInvoice.taxAmount) > 0 && (
                        <TableRow>
                          <TableCell>Tax</TableCell>
                          <TableCell className="text-right">{formatCurrency(selectedInvoice.taxAmount)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right text-lg">{formatCurrency(selectedInvoice.totalCost)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator className="my-4" />

                <div className="text-center text-sm text-gray-500">
                  <p>Thank you for shipping with GoABLP!</p>
                  <p>Questions? Contact us at support@goablp.com</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrint} data-testid="button-print-invoice">
                  <Printer className="h-4 w-4 mr-2" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          /* Hide everything */
          body > * {
            display: none !important;
          }
          
          /* Show and position the invoice */
          body::before {
            content: none !important;
          }
          
          /* Target the Radix portal container */
          [data-radix-portal] {
            display: block !important;
            position: static !important;
          }
          
          [data-radix-portal] > * {
            display: none !important;
          }
          
          /* Hide dialog overlay */
          [role="dialog"] {
            position: static !important;
            display: block !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          /* Hide the dialog backdrop/overlay */
          [data-state="open"][data-radix-portal] > div:first-child {
            display: none !important;
          }
          
          /* Show only invoice content */
          #invoice-content {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
          
          #invoice-content * {
            visibility: visible !important;
          }
          
          /* Hide print button in invoice */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Ensure proper page sizing */
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          /* Remove any extra spacing */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}
