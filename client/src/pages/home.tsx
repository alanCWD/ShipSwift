import { useState } from 'react';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import LoginModal from '../components/auth/login-modal';
import RegisterModal from '../components/auth/register-modal';
import RateCalculator from '../components/shipping/rate-calculator';
import RateResults from '../components/shipping/rate-results';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, BarChart3, Palette } from 'lucide-react';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [rateResults, setRateResults] = useState<any[] | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onLogin={() => setShowLoginModal(true)}
        onRegister={() => setShowRegisterModal(true)}
      />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Streamlined Canadian
              <span className="block">Shipping Solutions</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Compare rates from major Canadian carriers, manage shipments, and provide branded tracking experiences for your customers. Save up to 70% on shipping costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
                onClick={() => document.getElementById('rate-calculator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Instant Quote
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-700 hover:text-white text-lg px-8 py-4"
                onClick={() => window.open('https://meeting.calendarhero.com/meetingalan', '_blank')}
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Calculator */}
      <div id="rate-calculator" className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Your Shipping Quote</h2>
            <p className="text-lg text-gray-600">Compare rates from Canada's top carriers in seconds</p>
          </div>
          
          <RateCalculator onRatesReceived={setRateResults} />
        </div>
      </div>

      {/* Rate Results */}
      {rateResults && (
        <RateResults rates={rateResults} />
      )}

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Canadian Shipping Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your shipping operations efficiently, from rate comparison to branded customer experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate Comparison</h3>
                <p className="text-gray-600 mb-4">
                  Instantly compare shipping rates from major Canadian carriers including Canada Post, Purolator, UPS, FedEx, and regional carriers.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Real-time pricing
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Multiple service levels
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Cross-border capabilities
                  </li>
                </ul>
              </CardContent>
            </Card>



            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Shipment Management</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive shipment tracking and management tools with automated notifications, label printing, and reporting.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Professional label printing
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Automated notifications
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Delivery confirmations
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                  <Palette className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Branded Customization</h3>
                <p className="text-gray-600 mb-4">
                  Customizable branding options that allow your customers to track shipments under your company brand with full white-label solutions.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Custom branding
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Branded tracking pages
                  </li>
                  <li className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Logo customization
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
