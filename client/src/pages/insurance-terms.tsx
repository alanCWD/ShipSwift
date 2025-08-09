import { Link } from 'wouter';
import { Shield, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InsuranceTerms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/create-shipment">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Shipping
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Additional Insurance Terms</h1>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            These terms apply to additional insurance coverage beyond the carrier's standard liability. 
            Please review carefully before purchasing additional insurance for your shipment.
          </p>
        </div>

        {/* Insurance Coverage Terms */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Insurance Coverage Terms</h2>
          </div>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">1. Coverage Scope</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Additional insurance provides coverage beyond the carrier's standard liability limits</li>
                <li>Coverage applies to loss, damage, or destruction of the shipment during transit</li>
                <li>Maximum coverage amount is based on the declared value of goods</li>
                <li>Coverage is valid from the time of pickup until delivery confirmation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">2. Claim Requirements</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Claims must be reported within 30 days of delivery or expected delivery date</li>
                <li>Written notice of claim must be provided with supporting documentation</li>
                <li>Original receipts or proof of value must be provided for all claimed items</li>
                <li>Damaged items must be made available for inspection</li>
                <li>Accurate description of goods is required - failure to provide accurate descriptions will void coverage</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">3. Coverage Limitations</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Coverage is limited to the actual cash value or replacement cost, whichever is lower</li>
                <li>Depreciation may apply to used or pre-owned items</li>
                <li>Consequential or indirect damages are not covered</li>
                <li>Claims for mysterious disappearance without evidence of external damage are limited</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">4. Deductibles and Premiums</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Insurance premiums are calculated based on declared value and destination</li>
                <li>Minimum premium charges may apply</li>
                <li>Deductibles may apply to certain types of claims</li>
                <li>Premium refunds are not available once shipment is in transit</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prohibited Items */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Products That Cannot Be Insured</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-medium mb-4">
              The following items are excluded from additional insurance coverage:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Prohibited Items</h3>
              <ul className="space-y-2 text-gray-700 list-disc pl-6">
                <li>Cash, currency, coins, and precious metals</li>
                <li>Securities, bonds, stocks, and negotiable instruments</li>
                <li>Credit cards, debit cards, and payment cards</li>
                <li>Jewelry and precious stones (unless declared and approved)</li>
                <li>Antiques and collectibles (unless declared and approved)</li>
                <li>Artwork and fine art (unless declared and approved)</li>
                <li>Furs and luxury items</li>
                <li>Perishable goods and food items</li>
                <li>Live animals and plants</li>
                <li>Hazardous materials and dangerous goods</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restricted Items</h3>
              <ul className="space-y-2 text-gray-700 list-disc pl-6">
                <li>Electronics without original packaging</li>
                <li>Fragile items without proper packaging</li>
                <li>Liquids and powders (restricted coverage)</li>
                <li>Used clothing and personal effects</li>
                <li>Documents and papers (limited coverage)</li>
                <li>Software and digital media</li>
                <li>Prototypes and samples (limited coverage)</li>
                <li>Items over 10 years old (depreciation applies)</li>
                <li>Refurbished or reconditioned items</li>
                <li>Items purchased from online marketplaces (proof of authenticity required)</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-yellow-700 text-sm">
                  Items not listed above may still be subject to coverage limitations or exclusions. 
                  For high-value or specialty items, please contact customer service for pre-approval 
                  and specific coverage terms. Providing inaccurate descriptions or failing to disclose 
                  the true nature of goods being shipped will void any insurance coverage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            For questions about insurance coverage or to file a claim, contact our support team at{' '}
            <a href="mailto:support@ablplogistics.ca" className="text-blue-600 hover:underline">
              support@ablplogistics.ca
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}