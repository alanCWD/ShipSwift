import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import StatsCards from '../components/dashboard/stats-cards';
import RecentShipments from '../components/dashboard/recent-shipments';

export default function Dashboard() {
  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['/api/shipments'],
  });

  const shipments = (shipmentsData as any)?.shipments || [];

  // Calculate stats from shipments (exclude cancelled shipments)
  const activeShipments = shipments.filter((s: any) => s.status !== 'cancelled');
  const stats = {
    totalShipments: activeShipments.length,
    delivered: activeShipments.filter((s: any) => s.status === 'delivered').length,
    inTransit: activeShipments.filter((s: any) => s.status === 'shipped').length,
    totalSaved: activeShipments.reduce((sum: number, s: any) => sum + parseFloat(s.markupCost || '0'), 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your shipping activity</p>
        </div>

        <StatsCards stats={stats} />
        <RecentShipments shipments={shipments} />
      </div>
      
      <Footer />
    </div>
  );
}
