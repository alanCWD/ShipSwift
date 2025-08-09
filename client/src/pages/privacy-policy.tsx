import { Link } from 'wouter';
import { Shield, ArrowLeft, Eye, Lock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            ABLP Logistics is committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
          </p>
          
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> August 2025
          </p>
        </div>

        {/* Information Collection */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Personal Information</h3>
              <p className="mb-3">We collect personal information that you provide directly to us, including:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Contact information (name, email address, phone number, mailing address)</li>
                <li>Business information (company name, business address, industry type)</li>
                <li>Shipping and billing addresses for yourself and recipients</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Account credentials and preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Shipping Information</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Package details (dimensions, weight, contents description)</li>
                <li>Pickup and delivery addresses and contact information</li>
                <li>Special handling instructions and delivery preferences</li>
                <li>Tracking and delivery confirmation data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Usage Information</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage patterns and interaction with our platform</li>
                <li>Log files and analytics data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Information</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>We use the collected information for the following purposes:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Service Delivery:</strong> Processing shipping requests, generating labels, and facilitating deliveries</li>
              <li><strong>Communication:</strong> Sending shipping updates, delivery notifications, and customer support</li>
              <li><strong>Account Management:</strong> Creating and maintaining user accounts, processing payments</li>
              <li><strong>Platform Improvement:</strong> Analyzing usage patterns to enhance our services and user experience</li>
              <li><strong>Compliance:</strong> Meeting legal requirements, customs declarations, and regulatory obligations</li>
              <li><strong>Marketing:</strong> Sending promotional materials and service updates (with your consent)</li>
              <li><strong>Security:</strong> Detecting fraud, protecting against unauthorized access, and ensuring platform security</li>
            </ul>
          </div>
        </div>

        {/* Information Sharing */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Information Sharing and Disclosure</h2>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <p>We may share your information in the following circumstances:</p>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Service Providers</h3>
              <p>We share information with trusted third-party service providers who assist us in:</p>
              <ul className="space-y-2 list-disc pl-6 mt-2">
                <li>Shipping carriers (Canada Post, Purolator, UPS, FedEx, DHL, and others)</li>
                <li>Payment processing services</li>
                <li>Cloud hosting and data storage providers</li>
                <li>Customer support and communication platforms</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Legal Requirements</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Compliance with applicable laws and regulations</li>
                <li>Response to legal processes, court orders, or government requests</li>
                <li>Protection of our rights, property, or safety, and that of our users</li>
                <li>Customs and border control authorities for international shipments</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, with appropriate notice provided.</p>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Security</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>We implement appropriate technical and organizational security measures to protect your personal information:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and monitoring</li>
              <li>Access controls and authentication measures</li>
              <li>Secure data centers and infrastructure</li>
              <li>Regular software updates and security patches</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="mt-4">However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but continuously work to improve our security measures.</p>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Rights and Choices</h2>
          
          <div className="space-y-4 text-gray-700">
            <p>You have the following rights regarding your personal information:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Request a copy of your information in a structured format</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests or direct marketing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
            </ul>
            <p className="mt-4">To exercise these rights, please contact us at <a href="mailto:privacy@ablplogistics.ca" className="text-blue-600 hover:underline">privacy@ablplogistics.ca</a>.</p>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Retention</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">We retain your personal information for as long as necessary to:</p>
            <ul className="space-y-2 list-disc pl-6 mb-4">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Improve our services and user experience</li>
            </ul>
            <p>Typically, we retain account information for 7 years after account closure, and shipping records for 7 years after completion, unless longer retention is required by law.</p>
          </div>
        </div>

        {/* International Transfers */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">International Data Transfers</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">Your information may be transferred to and processed in countries other than Canada, including the United States. When we transfer personal information internationally, we ensure appropriate safeguards are in place, including:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Adequacy decisions by relevant privacy authorities</li>
              <li>Standard contractual clauses approved by privacy regulators</li>
              <li>Certification schemes and codes of conduct</li>
              <li>Other appropriate safeguards as required by applicable law</li>
            </ul>
          </div>
        </div>

        {/* Children's Privacy */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Children's Privacy</h2>
          
          <div className="text-gray-700">
            <p>Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately so we can delete such information.</p>
          </div>
        </div>

        {/* Policy Updates */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Updates to This Policy</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:</p>
            <ul className="space-y-2 list-disc pl-6 mb-4">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices on our platform</li>
            </ul>
            <p>Your continued use of our services after such notification constitutes acceptance of the updated policy.</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Us</h2>
          
          <div className="text-gray-700">
            <p className="mb-4">If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">ABLP Logistics - Privacy Office</p>
              <p>44322 Yale Rd #3, Chilliwack, BC V2R 4H1, Canada</p>
              <p>Email: <a href="mailto:privacy@ablplogistics.ca" className="text-blue-600 hover:underline">privacy@ablplogistics.ca</a></p>
              <p>Phone: (604) 392-3923</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}