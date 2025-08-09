import { useState } from 'react';
import { X, Phone, Mail, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
}

export default function ContactModal({ isOpen, onClose, serviceType }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceType: serviceType,
    urgency: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate contact form submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Request Submitted Successfully",
        description: "Our team will contact you within 2 business hours with your custom quote.",
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        serviceType: serviceType,
        urgency: '',
        message: ''
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly at (604) 392-3923.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contact for Custom Quote</h2>
            <p className="text-gray-600">Service: <span className="font-medium">{serviceType}</span></p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contact Options */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Contact Options</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Call Now</p>
              <a href="tel:6043923923" className="text-blue-600 hover:underline text-sm">
                (604) 392-3923
              </a>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Email</p>
              <a href="mailto:quotes@ablplogistics.ca" className="text-green-600 hover:underline text-sm">
                quotes@ablplogistics.ca
              </a>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Response Time</p>
              <p className="text-purple-600 text-sm">Within 2 hours</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Submit a Quote Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  placeholder="(604) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="mt-1"
                  placeholder="Your company name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="urgency" className="text-sm font-medium text-gray-700">
                How soon do you need this service?
              </Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (within 24 hours)</SelectItem>
                  <SelectItem value="week">Within 1 week</SelectItem>
                  <SelectItem value="month">Within 1 month</SelectItem>
                  <SelectItem value="planning">Just planning ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Shipment Details *
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                required
                className="mt-1 h-32"
                placeholder={`Please provide details about your ${serviceType} needs:
• Origin and destination locations
• Approximate weight and dimensions
• Type of goods being shipped
• Any special handling requirements
• Preferred pickup/delivery dates`}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• We'll review your requirements within 2 business hours</li>
                <li>• Our freight specialist will contact you with a custom quote</li>
                <li>• We'll arrange pickup and delivery to meet your timeline</li>
                <li>• You'll receive tracking information and regular updates</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}