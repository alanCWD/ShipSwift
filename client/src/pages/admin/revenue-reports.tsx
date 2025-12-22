import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, TrendingUp, Package, Download, Calendar as CalendarIcon, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface RevenueData {
  summary: {
    total_shipments: string;
    total_markup_revenue: string;
    total_base_cost: string;
    total_revenue: string;
    total_tax: string;
  };
  byCarrier: Array<{
    carrier_name: string;
    shipment_count: string;
    markup_revenue: string;
    base_cost: string;
    total_revenue: string;
  }>;
  byType: Array<{
    shipment_type: string;
    shipment_count: string;
    markup_revenue: string;
    total_revenue: string;
  }>;
  dailyTrend: Array<{
    date: string;
    shipment_count: string;
    markup_revenue: string;
    total_revenue: string;
  }>;
  details: Array<{
    id: string;
    tracking_number: string | null;
    carrier_name: string;
    service_name: string;
    shipment_type: string;
    base_cost: string;
    markup_cost: string;
    total_cost: string;
    tax_amount: string | null;
    status: string;
    created_at: string;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function RevenueReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    const queryString = params.toString();
    return queryString ? `/api/admin/revenue-reports?${queryString}` : '/api/admin/revenue-reports';
  };

  const { data, isLoading, refetch } = useQuery<RevenueData>({
    queryKey: ['/api/admin/revenue-reports', { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }],
    queryFn: async () => {
      const response = await fetch(buildUrl(), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    const queryString = params.toString();
    const url = queryString ? `/api/admin/revenue-reports/export?${queryString}` : '/api/admin/revenue-reports/export';
    
    window.open(url, '_blank');
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const chartData = data?.dailyTrend.map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    markup: parseFloat(d.markup_revenue),
    total: parseFloat(d.total_revenue),
    shipments: parseInt(d.shipment_count)
  })) || [];

  const carrierPieData = data?.byCarrier.map(c => ({
    name: c.carrier_name,
    value: parseFloat(c.markup_revenue)
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Reports</h2>
          <p className="text-gray-600">Detailed earnings from markup fees</p>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
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

            <Button onClick={() => refetch()} data-testid="button-apply-filter">
              Apply Filter
            </Button>

            {(startDate || endDate) && (
              <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading revenue data...</span>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Markup Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600" data-testid="text-markup-revenue">
                  {formatCurrency(data.summary.total_markup_revenue)}
                </p>
                <p className="text-sm text-gray-500">Your profit from markups</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600" data-testid="text-total-revenue">
                  {formatCurrency(data.summary.total_revenue)}
                </p>
                <p className="text-sm text-gray-500">Including carrier costs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-total-shipments">
                  {data.summary.total_shipments}
                </p>
                <p className="text-sm text-gray-500">Total processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Avg. Markup/Shipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600" data-testid="text-avg-markup">
                  {formatCurrency(
                    parseInt(data.summary.total_shipments) > 0
                      ? parseFloat(data.summary.total_markup_revenue) / parseInt(data.summary.total_shipments)
                      : 0
                  )}
                </p>
                <p className="text-sm text-gray-500">Per shipment</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Markup revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="markup" fill="#10B981" name="Markup Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Carrier</CardTitle>
                <CardDescription>Markup distribution across carriers</CardDescription>
              </CardHeader>
              <CardContent>
                {carrierPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={carrierPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {carrierPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Carrier</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carrier</TableHead>
                      <TableHead className="text-right">Shipments</TableHead>
                      <TableHead className="text-right">Markup Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byCarrier.map((carrier, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{carrier.carrier_name}</TableCell>
                        <TableCell className="text-right">{carrier.shipment_count}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(carrier.markup_revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.byCarrier.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Shipment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Shipments</TableHead>
                      <TableHead className="text-right">Markup Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byType.map((type, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium capitalize">{type.shipment_type}</TableCell>
                        <TableCell className="text-right">{type.shipment_count}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(type.markup_revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.byType.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Last 500 shipments with revenue details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Base Cost</TableHead>
                      <TableHead className="text-right">Markup</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.details.slice(0, 50).map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{format(new Date(shipment.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {shipment.tracking_number || '-'}
                        </TableCell>
                        <TableCell>{shipment.carrier_name}</TableCell>
                        <TableCell className="capitalize">{shipment.shipment_type}</TableCell>
                        <TableCell className="text-right">{formatCurrency(shipment.base_cost)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(shipment.markup_cost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(shipment.total_cost)}</TableCell>
                        <TableCell>
                          <Badge variant={shipment.status === 'delivered' ? 'default' : 'secondary'}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.details.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No shipments found for the selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {data.details.length > 50 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Showing 50 of {data.details.length} shipments. Export CSV for full data.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
