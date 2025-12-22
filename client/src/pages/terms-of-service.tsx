import { Link } from 'wouter';
import { FileText, ArrowLeft, Scale, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            These Terms of Service ("Terms") govern your access to and use of the shipping and logistics services 
            provided by ABLP Logistics. By using our services, you agree to be bound by these Terms.
          </p>
          
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> December 2025
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Acceptance of Terms</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>By accessing or using our platform, creating an account, or utilizing our shipping services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.</p>
            <p>If you do not agree to these Terms, you must not use our services. We may modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of our services following any modifications constitutes your acceptance of the modified Terms.</p>
          </div>
        </div>

        {/* Description of Services */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Description of Services</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>ABLP Logistics provides shipping and logistics services, including:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Rate comparison across multiple carriers</li>
              <li>Shipment booking and label generation</li>
              <li>Package tracking and delivery notifications</li>
              <li>Insurance options for shipments</li>
              <li>Customs documentation assistance</li>
              <li>Account management and reporting tools</li>
              <li>Customer support and assistance</li>
            </ul>
            <p>We act as an intermediary between you and various shipping carriers. The actual transportation of your shipments is performed by third-party carriers, each with their own terms and conditions.</p>
          </div>
        </div>

        {/* User Accounts and Registration */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">User Accounts and Registration</h2>
          
          <div className="space-y-4 text-gray-700">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Account Creation</h3>
            <ul className="space-y-2 list-disc pl-6">
              <li>You must provide accurate, complete, and current information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>Business accounts require proper authorization to act on behalf of the business</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Account Responsibilities</h3>
            <ul className="space-y-2 list-disc pl-6">
              <li>You are responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Keep your account information current and accurate</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </div>
        </div>

        {/* Shipping Terms */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shipping Terms and Conditions</h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Shipment Requirements</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>All shipments must comply with applicable laws and carrier restrictions</li>
                <li>Accurate package dimensions, weight, and contents description required</li>
                <li>Proper packaging to protect contents during transit</li>
                <li>Valid pickup and delivery addresses with contact information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Prohibited Items</h3>
              <p className="mb-2">The following items are prohibited from shipment:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Hazardous materials, explosives, and dangerous goods</li>
                <li>Illegal substances and contraband items</li>
                <li>Live animals (unless specifically authorized)</li>
                <li>Perishable items without proper arrangements</li>
                <li>Currency, securities, and negotiable instruments</li>
                <li>Items that violate intellectual property rights</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Delivery and Risk of Loss</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Risk of loss transfers to the carrier upon pickup</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Signature confirmation may be required for delivery</li>
                <li>Claims for lost or damaged items must be reported promptly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Terms</h2>
          
          <div className="space-y-4 text-gray-700">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Fees and Charges</h3>
            <ul className="space-y-2 list-disc pl-6">
              <li>All shipping costs must be paid in advance unless credit terms are approved</li>
              <li>Prices include applicable taxes and carrier surcharges</li>
              <li>Additional fees may apply for special services or handling</li>
              <li>Currency exchange rates may apply for international shipments</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Payment Methods</h3>
            <ul className="space-y-2 list-disc pl-6">
              <li>We accept major credit cards, debit cards, and approved business accounts</li>
              <li>Payment processing is handled by secure third-party providers</li>
              <li>Automatic payment methods may be set up for regular users</li>
              <li>Refunds are processed according to our refund policy</li>
            </ul>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Limitation of Liability</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-medium mb-4">
              IMPORTANT: Please read this section carefully as it limits our liability.
            </p>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>To the maximum extent permitted by law:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>ABLP Logistics acts as an intermediary between you and shipping carriers</li>
              <li>Our liability is limited to the service fees paid to us, not the full shipment value</li>
              <li>We are not liable for carrier delays, loss, or damage beyond carrier liability limits</li>
              <li>We disclaim warranties of merchantability, fitness for purpose, and non-infringement</li>
              <li>We are not liable for indirect, incidental, special, or consequential damages</li>
              <li>Total liability in any case shall not exceed the fees paid for the specific service</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Additional insurance coverage is available for shipments requiring protection beyond carrier liability limits.
              </p>
            </div>
          </div>
        </div>

        {/* User Conduct */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Acceptable Use and User Conduct</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>You agree not to:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Use our services for any unlawful purpose or in violation of these Terms</li>
              <li>Provide false, misleading, or inaccurate information</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use our services to transmit harmful, offensive, or inappropriate content</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Engage in fraudulent or deceptive practices</li>
            </ul>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Intellectual Property</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>All content, features, and functionality of our platform are owned by ABLP Logistics or our licensors and are protected by copyright, trademark, and other intellectual property laws.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">License to Use</h3>
            <p>We grant you a limited, non-exclusive, non-transferable license to use our services for their intended purpose, subject to these Terms.</p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Restrictions</h3>
            <ul className="space-y-2 list-disc pl-6">
              <li>You may not copy, modify, distribute, or reverse engineer our software</li>
              <li>You may not use our trademarks without written permission</li>
              <li>You may not create derivative works based on our platform</li>
              <li>Any feedback or suggestions you provide may be used by us without compensation</li>
            </ul>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Privacy</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">Your privacy is important to us. Our collection, use, and disclosure of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
            <p>By using our services, you consent to the collection, use, and disclosure of your information as described in our Privacy Policy.</p>
          </div>
        </div>

        {/* Termination */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Termination</h2>
          
          <div className="space-y-4 text-gray-700">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Termination by You</h3>
            <p>You may terminate your account at any time by contacting customer support. You remain responsible for all charges incurred before termination.</p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Termination by Us</h3>
            <p>We may suspend or terminate your account immediately if you:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Violate these Terms or our policies</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Fail to pay outstanding charges</li>
              <li>Provide false or misleading information</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Effect of Termination</h3>
            <p>Upon termination, your right to use our services ceases immediately. We may retain certain information as required by law or for legitimate business purposes.</p>
          </div>
        </div>

        {/* Governing Law */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Governing Law and Dispute Resolution</h2>
          
          <div className="space-y-4 text-gray-700">
            <h3 className="text-xl font-medium text-gray-900 mb-3">Governing Law</h3>
            <p>These Terms are governed by and construed in accordance with the laws of British Columbia, Canada, without regard to conflict of law principles.</p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Jurisdiction</h3>
            <p>Any disputes arising from these Terms or our services shall be resolved in the courts of British Columbia, Canada. You consent to the personal jurisdiction of such courts.</p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Dispute Resolution</h3>
            <p>Before filing any legal action, parties agree to attempt resolution through good faith negotiation. If negotiation fails, disputes may be resolved through binding arbitration or court proceedings.</p>
          </div>
        </div>

        {/* General Provisions */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">General Provisions</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Entire Agreement</h3>
              <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and ABLP Logistics regarding our services.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Severability</h3>
              <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Waiver</h3>
              <p>Our failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce such provision in the future.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Assignment</h3>
              <p>You may not assign or transfer your rights under these Terms without our written consent. We may assign our rights and obligations without restriction.</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">If you have questions about these Terms of Service, please contact us:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">ABLP Logistics - Legal Department</p>
              <p>44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada</p>
              <p>Email: <a href="mailto:legal@ablplogistics.ca" className="text-blue-600 hover:underline">legal@ablplogistics.ca</a></p>
              <p>Phone: (604) 392-3923</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}