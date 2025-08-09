import { Package, Truck, Warehouse, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import ContactModal from './contact-modal';

export default function MultiModalOptions() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<string>('');

  const handleContactClick = (serviceType: string) => {
    setContactType(serviceType);
    setShowContactModal(true);
  };

  return (
    <>
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Multi-Modal Shipping Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From small packages to large freight shipments, we provide comprehensive shipping solutions for all your logistics needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Small Package Courier */}
            <Card className="hover:shadow-lg transition-shadow border-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Small Package Courier</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Perfect for documents, small packages, and e-commerce shipments. Compare rates instantly and create labels online.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Weight Range:</span>
                    <span className="font-medium">Up to 70 lbs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Max Dimensions:</span>
                    <span className="font-medium">48" x 36" x 36"</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Carriers:</span>
                    <span className="font-medium">7+ Major Carriers</span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm font-medium mb-2">✓ Available Now</p>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Instant rate comparison</li>
                    <li>• Online label creation</li>
                    <li>• Real-time tracking</li>
                    <li>• Insurance options</li>
                  </ul>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => document.getElementById('rate-calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Quote Now
                </Button>
              </CardContent>
            </Card>

            {/* LTL Freight Services */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">LTL Freight Services</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Cost-effective solution for shipments too large for courier but don't require a full truck. Professional freight handling.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Weight Range:</span>
                    <span className="font-medium">150 - 15,000 lbs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Typical Items:</span>
                    <span className="font-medium">Machinery, Furniture</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">Terminal to Terminal</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm font-medium mb-2">⚡ Custom Quotes</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Competitive freight rates</li>
                    <li>• Professional handling</li>
                    <li>• Delivery appointments</li>
                    <li>• Insurance coverage</li>
                  </ul>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleContactClick('LTL Freight')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact for Quote
                </Button>
              </CardContent>
            </Card>

            {/* Pallet Shipping */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-purple-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Warehouse className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Pallet Shipping</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Specialized handling for palletized goods with professional equipment. Ideal for wholesale and distribution needs.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Standard Pallet:</span>
                    <span className="font-medium">48" x 40" x 72"</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Weight Limit:</span>
                    <span className="font-medium">Up to 4,000 lbs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Handling:</span>
                    <span className="font-medium">Forklift Equipment</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-purple-800 text-sm font-medium mb-2">🏭 Specialized Service</p>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>• Professional pallet handling</li>
                    <li>• Warehouse to warehouse</li>
                    <li>• Loading dock delivery</li>
                    <li>• Volume discounts</li>
                  </ul>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleContactClick('Pallet Shipping')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help Choosing?</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our shipping experts can help you determine the best solution for your specific needs and provide competitive quotes.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Phone Support</h4>
                <p className="text-sm text-gray-600 mb-3">Speak directly with our logistics specialists</p>
                <a href="tel:6043923923" className="text-blue-600 hover:underline font-medium">(604) 392-3923</a>
              </div>
              
              <div className="text-center">
                <Mail className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Email Quotes</h4>
                <p className="text-sm text-gray-600 mb-3">Detailed quotes sent to your inbox</p>
                <a href="mailto:quotes@ablplogistics.ca" className="text-green-600 hover:underline font-medium">quotes@ablplogistics.ca</a>
              </div>
              
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
                <p className="text-sm text-gray-600 mb-3">Instant assistance during business hours</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleContactClick('Live Chat')}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        serviceType={contactType}
      />
    </>
  );
}