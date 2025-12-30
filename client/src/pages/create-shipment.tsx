import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import RateCalculator from '@/components/shipping/rate-calculator';
import RateResults from '@/components/shipping/rate-results';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateShipment() {
  const [rateResults, setRateResults] = useState<any[] | null>(null);
  const [addressData, setAddressData] = useState<any>(null);

  // For now, skip authentication check to test the rate calculator
  // We'll rely on the API endpoints to handle authentication

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Shipment</h1>
          <p className="text-gray-600 mt-2">
            Enter your package details to compare shipping rates and create your shipment
          </p>
        </div>

        {/* Rate Calculator */}
        <div className="mb-8">
          <RateCalculator onRatesReceived={(rates, address) => {
            setRateResults(rates);
            setAddressData(address);
          }} />
        </div>

        {/* Rate Results */}
        {rateResults && (
          <RateResults rates={rateResults} addressData={addressData} />
        )}
      </div>
      
      <Footer />
    </div>
  );
}