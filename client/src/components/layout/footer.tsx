import { Link } from 'wouter';
import { MapPin, Phone, Mail } from 'lucide-react';
import goAblpLogo from '@assets/GO ABLP logo (500 x 300 px)_1760196935840.png';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src={goAblpLogo} 
                alt="GoABLP" 
                className="h-[120px]"
              />
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
                <a href="tel:+16043923923" className="hover:text-white transition-colors">(604) 392-3923</a>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                support@goablp.com
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
              <li><a href="mailto:support@goablp.com" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><Link href="/insurance-terms" className="hover:text-white transition-colors">Insurance Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300">&copy; 2025 GoABLP - A subsidiary of <a href="https://ablplogistics.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ABLP Logistics</a>. All rights reserved.</p>
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
