import { Link } from 'wouter';
import { Cookie, ArrowLeft, Settings, Eye, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            This Cookie Policy explains how ABLP Logistics uses cookies and similar tracking technologies 
            on our website and services. We use cookies to enhance your experience, analyze usage, and provide personalized content.
          </p>
          
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> December 2025
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">What Are Cookies?</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They help websites remember information about your visit, such as your preferences and login status.</p>
            
            <p>We also use similar technologies such as:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Web beacons:</strong> Small graphics that help us analyze user behavior and website traffic</li>
              <li><strong>Local storage:</strong> Technology that stores data locally in your browser</li>
              <li><strong>Session storage:</strong> Temporary storage that expires when you close your browser</li>
              <li><strong>Pixels:</strong> Transparent image files used to track user interactions</li>
            </ul>
          </div>
        </div>

        {/* Types of Cookies */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Types of Cookies We Use</h2>
          </div>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Essential Cookies
              </h3>
              <p className="text-gray-700 mb-3">These cookies are necessary for our website to function properly and cannot be disabled.</p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2"><strong>Purpose:</strong></p>
                <ul className="text-sm text-green-700 space-y-1 list-disc pl-4">
                  <li>User authentication and security</li>
                  <li>Shopping cart functionality</li>
                  <li>Form submission and data processing</li>
                  <li>Load balancing and performance optimization</li>
                </ul>
                <p className="text-sm text-green-800 mt-3"><strong>Storage Duration:</strong> Session or up to 1 year</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Analytics Cookies
              </h3>
              <p className="text-gray-700 mb-3">These cookies help us understand how visitors interact with our website.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2"><strong>Purpose:</strong></p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                  <li>Website traffic analysis and reporting</li>
                  <li>User behavior tracking and heatmaps</li>
                  <li>Performance monitoring and optimization</li>
                  <li>Error tracking and debugging</li>
                </ul>
                <p className="text-sm text-blue-800 mt-3"><strong>Storage Duration:</strong> Up to 2 years</p>
                <p className="text-sm text-blue-800"><strong>Third Parties:</strong> Google Analytics, Hotjar</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Functional Cookies
              </h3>
              <p className="text-gray-700 mb-3">These cookies enable enhanced functionality and personalization.</p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800 mb-2"><strong>Purpose:</strong></p>
                <ul className="text-sm text-purple-700 space-y-1 list-disc pl-4">
                  <li>Remembering user preferences and settings</li>
                  <li>Language and region selection</li>
                  <li>Customized content and recommendations</li>
                  <li>Social media integration features</li>
                </ul>
                <p className="text-sm text-purple-800 mt-3"><strong>Storage Duration:</strong> Up to 1 year</p>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-orange-600" />
                Marketing Cookies
              </h3>
              <p className="text-gray-700 mb-3">These cookies are used to deliver relevant advertisements and marketing content.</p>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-800 mb-2"><strong>Purpose:</strong></p>
                <ul className="text-sm text-orange-700 space-y-1 list-disc pl-4">
                  <li>Targeted advertising and retargeting</li>
                  <li>Conversion tracking and attribution</li>
                  <li>Social media advertising optimization</li>
                  <li>Email marketing campaign tracking</li>
                </ul>
                <p className="text-sm text-orange-800 mt-3"><strong>Storage Duration:</strong> Up to 2 years</p>
                <p className="text-sm text-orange-800"><strong>Third Parties:</strong> Google Ads, Facebook, LinkedIn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Management */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Managing Your Cookie Preferences</h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Browser Settings</h3>
              <p className="mb-4">You can control cookies through your browser settings. Most browsers allow you to:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>View cookies that have been set and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies from being set</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Browser-Specific Instructions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Google Chrome</h4>
                  <p className="text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Firefox</h4>
                  <p className="text-sm">Settings → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Safari</h4>
                  <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Microsoft Edge</h4>
                  <p className="text-sm">Settings → Cookies and site permissions → Cookies and site data</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Please Note:</strong> Disabling certain cookies may affect the functionality of our website 
                and limit your access to some features and services.
              </p>
            </div>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Third-Party Cookies and Services</h2>
          
          <div className="space-y-6 text-gray-700">
            <p>We work with third-party service providers who may set cookies on our website. These providers have their own privacy policies and cookie policies:</p>
            
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Google Analytics</h3>
                <p className="text-sm mb-2">Provides website analytics and user behavior insights.</p>
                <p className="text-sm">Opt-out: <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Google Ads</h3>
                <p className="text-sm mb-2">Enables targeted advertising and conversion tracking.</p>
                <p className="text-sm">Opt-out: <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ad Settings</a></p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Social Media Platforms</h3>
                <p className="text-sm mb-2">Facebook, LinkedIn, and other social platforms may set cookies for sharing and advertising features.</p>
                <p className="text-sm">Manage preferences through respective platform settings.</p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Payment Processors</h3>
                <p className="text-sm mb-2">Stripe and other payment providers use cookies for fraud prevention and transaction processing.</p>
                <p className="text-sm">These cookies are essential for secure payment processing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Applications */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mobile Applications and Tracking</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>If you access our services through a mobile application, we may use similar tracking technologies:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Device Identifiers:</strong> Unique identifiers for analytics and personalization</li>
              <li><strong>Local Storage:</strong> Data stored locally on your device for functionality</li>
              <li><strong>Push Notifications:</strong> Delivery and tracking of notification preferences</li>
              <li><strong>App Analytics:</strong> Usage patterns, crashes, and performance monitoring</li>
            </ul>
            
            <p className="mt-4">You can manage these preferences through your device settings:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>iOS:</strong> Settings → Privacy & Security → Tracking</li>
              <li><strong>Android:</strong> Settings → Privacy → Ads</li>
            </ul>
          </div>
        </div>

        {/* Cookie Updates */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Updates to This Policy</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">We may update this Cookie Policy from time to time to reflect changes in our practices, technology, or applicable regulations. When we make changes, we will:</p>
            <ul className="space-y-2 list-disc pl-6 mb-4">
              <li>Update the "Last Updated" date at the top of this policy</li>
              <li>Notify users through our website or email communications</li>
              <li>Obtain consent for new cookie types if required by law</li>
            </ul>
            <p>We encourage you to review this policy periodically to stay informed about our use of cookies.</p>
          </div>
        </div>

        {/* Your Choices */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Choices and Rights</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>You have several options regarding cookies:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Accept All:</strong> Allow all cookies for full website functionality</li>
              <li><strong>Essential Only:</strong> Accept only necessary cookies (may limit functionality)</li>
              <li><strong>Customize:</strong> Choose specific cookie categories to accept or reject</li>
              <li><strong>Withdraw Consent:</strong> Change your preferences at any time</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>Cookie Preferences:</strong> You can update your cookie preferences at any time by visiting our Cookie Settings 
                (usually found in the website footer) or by contacting us directly.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Us</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">If you have questions about this Cookie Policy or our use of cookies, please contact us:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">GoABLP - Privacy Team</p>
              <p>44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada</p>
              <p>Email: <a href="mailto:privacy@goablp.com" className="text-blue-600 hover:underline">privacy@goablp.com</a></p>
              <p>Phone: (604) 392-3923</p>
            </div>
            
            <p className="mt-4 text-sm">For immediate assistance with cookie settings, you can also reach our customer support team at <a href="mailto:support@goablp.com" className="text-blue-600 hover:underline">support@goablp.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}