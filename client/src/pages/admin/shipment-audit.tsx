import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Search, Eye, Package, CreditCard, MapPin, DollarSign, Calendar } from 'lucide-react';

interface ShipmentAudit {
  id: string;
  trackingNumber: string | null;
  status: string | null;
  carrierName: string;
  serviceName: string;
  baseCost: string;
  markupCost: string;
  totalCost: string;
  taxAmount: string | null;
  markupPercentage: string | null;
  stripeChargeId: string | null;
  customerPaymentSnapshot: { last4?: string; brand?: string; expMonth?: number; expYear?: number } | null;
  createdAt: string;
  rateBreakdown: any;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    hasPaymentMethod: boolean;
  } | null;
  fromAddress: any;
  toAddress: any;
}

interface AuditDetailData {
  shipment: {
    id: string;
    trackingNumber: string | null;
    status: string | null;
    carrierName: string;
    serviceName: string;
    shipmentType: string | null;
    createdAt: string;
  };
  customer: {
    id: string | undefined;
    email: string | undefined;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    companyName: string | null;
  };
  addresses: {
    from: any;
    to: any;
  };
  packageDetails: any;
  financial: {
    baseCost: number;
    markupCost: number;
    totalCost: number;
    taxAmount: number;
    carrierNetAmount: number;
    markupPercentage: number;
    currency: string;
    rateBreakdown: any;
  };
  payment: {
    stripeChargeId: string | null;
    stripeChargeSnapshot: any;
    customerPaymentSnapshot: any;
  };
  overage: any;
  labelUrl: string | null;
}

export default function ShipmentAuditPage() {
  const [search, setSearch] = useState('');
  const [carrier, setCarrier] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['/api/admin/shipments/audit', { page, search, carrier, status, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (search) params.set('search', search);
      if (carrier) params.set('carrier', carrier);
      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/admin/shipments/audit?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch audit data');
      return response.json();
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['/api/admin/shipments', selectedShipmentId, 'audit'],
    queryFn: async () => {
      if (!selectedShipmentId) return null;
      const response = await fetch(`/api/admin/shipments/${selectedShipmentId}/audit`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch shipment details');
      return response.json() as Promise<AuditDetailData>;
    },
    enabled: !!selectedShipmentId,
  });

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (carrier) params.set('carrier', carrier);
    if (status) params.set('status', status);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    window.open(`/api/admin/shipments/audit/export?${params}`, '_blank');
  };

  const formatAddress = (addr: any) => {
    if (!addr) return 'N/A';
    const parts = [
      addr.streetAddress || addr.street,
      addr.city,
      addr.state || addr.province,
      addr.postalCode,
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={statusColors[status || ''] || 'bg-gray-100 text-gray-800'}>
        {status || 'unknown'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipment Audit
            </CardTitle>
            <Button onClick={handleExport} variant="outline" className="gap-2" data-testid="button-export-csv">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={carrier} onValueChange={(v) => { setCarrier(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger data-testid="select-carrier">
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="Canada Post">Canada Post</SelectItem>
                <SelectItem value="Purolator">Purolator</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
                <SelectItem value="Canpar">Canpar</SelectItem>
                <SelectItem value="Loomis">Loomis</SelectItem>
                <SelectItem value="GLS">GLS</SelectItem>
                <SelectItem value="ICS">ICS</SelectItem>
                <SelectItem value="Intelcom">Intelcom</SelectItem>
                <SelectItem value="Day & Ross">Day & Ross</SelectItem>
                <SelectItem value="Nationex">Nationex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="Start Date"
              data-testid="input-start-date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="End Date"
              data-testid="input-end-date"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Tracking</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-center p-3 font-medium" title="Payment Method on File">
                        <CreditCard className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="text-left p-3 font-medium">Carrier</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Base + Surcharges</th>
                      <th className="text-right p-3 font-medium">Markup</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData?.shipments?.map((shipment: ShipmentAudit) => (
                      <tr key={shipment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {shipment.createdAt 
                            ? new Date(shipment.createdAt).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {shipment.trackingNumber || '-'}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {shipment.user?.companyName || 
                              `${shipment.user?.firstName || ''} ${shipment.user?.lastName || ''}`.trim() || 
                              'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">{shipment.user?.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          {shipment.user?.hasPaymentMethod ? (
                            <span title="Payment method on file">
                              <CreditCard className="w-4 h-4 mx-auto text-green-600" />
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{shipment.carrierName}</div>
                          <div className="text-xs text-gray-500">{shipment.serviceName}</div>
                        </td>
                        <td className="p-3">{getStatusBadge(shipment.status)}</td>
                        <td className="p-3 text-right font-mono">
                          {(() => {
                            const rb = shipment.rateBreakdown as any;
                            if (rb?.baseCharge?.amount !== undefined) {
                              const base = (rb.baseCharge.amount || 0) / 100;
                              const surcharges = Array.isArray(rb.surcharges) 
                                ? rb.surcharges.reduce((sum: number, s: any) => sum + ((s?.amount || 0) / 100), 0)
                                : 0;
                              return (
                                <>
                                  <div>${base.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">surcharges ${surcharges.toFixed(2)}</div>
                                </>
                              );
                            }
                            return <div>${(parseFloat(shipment.baseCost || '0') - parseFloat(shipment.markupCost || '0')).toFixed(2)}</div>;
                          })()}
                        </td>
                        <td className="p-3 text-right font-mono text-green-600">
                          +${parseFloat(shipment.markupCost || '0').toFixed(2)}
                          {shipment.markupPercentage && (
                            <div className="text-xs text-gray-500">
                              ({parseFloat(shipment.markupPercentage).toFixed(1)}%)
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium">
                          ${parseFloat(shipment.totalCost || '0').toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedShipmentId(shipment.id)}
                            data-testid={`button-view-${shipment.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!auditData?.shipments || auditData.shipments.length === 0) && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                          No shipments found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {auditData?.pagination && auditData.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * 25) + 1} - {Math.min(page * 25, auditData.pagination.total)} of {auditData.pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(auditData.pagination.totalPages, p + 1))}
                      disabled={page === auditData.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedShipmentId} onOpenChange={(open) => !open && setSelectedShipmentId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipment Audit Details
            </SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : detailData ? (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  Shipment Info
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tracking:</span>
                    <p className="font-mono">{detailData.shipment.trackingNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p>{getStatusBadge(detailData.shipment.status)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Carrier:</span>
                    <p>{detailData.shipment.carrierName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service:</span>
                    <p>{detailData.shipment.serviceName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="capitalize">{detailData.shipment.shipmentType || 'package'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p>{detailData.shipment.createdAt ? new Date(detailData.shipment.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4" />
                  Customer
                </h3>
                <div className="text-sm space-y-2">
                  {detailData.customer.companyName && (
                    <p><span className="text-gray-500">Company:</span> {detailData.customer.companyName}</p>
                  )}
                  <p><span className="text-gray-500">Name:</span> {`${detailData.customer.firstName || ''} ${detailData.customer.lastName || ''}`.trim() || 'N/A'}</p>
                  <p><span className="text-gray-500">Email:</span> {detailData.customer.email || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" />
                  Addresses
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">From:</span>
                    <p>{formatAddress(detailData.addresses.from)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">To:</span>
                    <p>{formatAddress(detailData.addresses.to)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4" />
                  Financial Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  {(() => {
                    const rb = detailData.financial.rateBreakdown as any;
                    if (rb?.baseCharge?.amount !== undefined) {
                      const base = (rb.baseCharge.amount || 0) / 100;
                      const surcharges = Array.isArray(rb.surcharges) 
                        ? rb.surcharges.reduce((sum: number, s: any) => sum + ((s?.amount || 0) / 100), 0)
                        : 0;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Base Rate:</span>
                            <span className="font-mono">${base.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Surcharges:</span>
                            <span className="font-mono">${surcharges.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Carrier Total:</span>
                    <span className="font-mono">${detailData.financial.carrierNetAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Markup ({detailData.financial.markupPercentage.toFixed(1)}%):</span>
                    <span className="font-mono">+${detailData.financial.markupCost.toFixed(2)}</span>
                  </div>
                  {detailData.financial.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax:</span>
                      <span className="font-mono">${detailData.financial.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Charged:</span>
                    <span className="font-mono">${detailData.financial.totalCost.toFixed(2)} {detailData.financial.currency}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </h3>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-gray-500">Stripe Charge ID:</span>{' '}
                    <span className="font-mono text-xs">{detailData.payment.stripeChargeId || 'N/A'}</span>
                  </p>
                  {detailData.payment.customerPaymentSnapshot && (
                    <p>
                      <span className="text-gray-500">Card:</span>{' '}
                      {detailData.payment.customerPaymentSnapshot.brand?.toUpperCase()} ****{detailData.payment.customerPaymentSnapshot.last4}
                      {detailData.payment.customerPaymentSnapshot.expMonth && (
                        <span className="text-gray-400 ml-2">
                          exp {detailData.payment.customerPaymentSnapshot.expMonth}/{detailData.payment.customerPaymentSnapshot.expYear}
                        </span>
                      )}
                    </p>
                  )}
                  {detailData.payment.stripeChargeSnapshot && (
                    <div className="bg-gray-50 rounded p-3 mt-2">
                      <p className="text-gray-500 text-xs mb-1">Stripe Snapshot:</p>
                      <div className="text-xs font-mono">
                        <p>Amount: {(detailData.payment.stripeChargeSnapshot.amount / 100).toFixed(2)} {detailData.payment.stripeChargeSnapshot.currency?.toUpperCase()}</p>
                        <p>Status: {detailData.payment.stripeChargeSnapshot.status}</p>
                        <p>Date: {new Date(detailData.payment.stripeChargeSnapshot.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {detailData.overage?.overageAmount && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Overage Details</h3>
                    <div className="text-sm space-y-2">
                      <p><span className="text-gray-500">Overage Amount:</span> ${parseFloat(detailData.overage.overageAmount).toFixed(2)}</p>
                      <p><span className="text-gray-500">Status:</span> {detailData.overage.overageStatus || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
