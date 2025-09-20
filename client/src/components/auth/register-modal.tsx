import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const handleLogin = () => {
    // Close modal and redirect to Replit OIDC (handles both login and registration)
    onClose();
    login();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Get Started</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center text-gray-600">
            <p>Start using ShipSwift with your Replit account</p>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            data-testid="button-continue-replit-register"
          >
            Continue with Replit
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <p>Your Replit account will be automatically connected to ShipSwift</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
