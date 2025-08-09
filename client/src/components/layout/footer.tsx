import { Link } from 'wouter';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-xl">
                ShipSwift
              </div>
              <span className="ml-3 text-2xl font-bold">Logistics</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Canadian shipping platform for ABLP Logistics.
            </p>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
(604) 392-3923
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                support@ablplogistics.ca
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/create-shipment" className="hover:text-white transition-colors">Create Shipment</Link></li>
              <li><Link href="/track" className="hover:text-white transition-colors">Track Package</Link></li>
              <li><Link href="/shipments" className="hover:text-white transition-colors">All Shipments</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/profile" className="hover:text-white transition-colors">Profile</Link></li>
              <li><Link href="/branding" className="hover:text-white transition-colors">Branding</Link></li>
              <li><a href="mailto:support@ablplogistics.ca" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><Link href="/insurance-terms" className="hover:text-white transition-colors">Insurance Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300">&copy; 2025 ShipSwift - Subsidiary of ABLP Logistics. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookie-policy" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
