import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    try {
      await register({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        role: 'customer',
      });
      
      toast({
        title: "Welcome to SwiftShip!",
        description: "Your account has been created successfully.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Smith"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Company Name
            </Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Your Company Ltd."
              value={formData.companyName}
              onChange={handleInputChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
              }
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              I agree to the{' '}
              <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0 h-auto">
                Terms of Service
              </Button>
              {' '}and{' '}
              <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0 h-auto">
                Privacy Policy
              </Button>
            </Label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="text-blue-600 hover:text-blue-800 font-medium p-0"
              onClick={onSwitchToLogin}
            >
              Sign in
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
