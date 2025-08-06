import { Card, CardContent } from '@/components/ui/card';
import { Package, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalShipments: number;
    delivered: number;
    inTransit: number;
    totalSaved: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const cardData = [
    {
      title: 'Total Shipments',
      value: stats.totalShipments.toString(),
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Delivered',
      value: stats.delivered.toString(),
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'In Transit',
      value: stats.inTransit.toString(),
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Total Saved',
      value: formatCurrency(stats.totalSaved),
      icon: DollarSign,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cardData.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
