import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAuth();

  const handleLogin = () => {
    // Close modal and redirect to Replit OIDC
    onClose();
    login();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Sign In</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center text-gray-600">
            <p>Sign in securely with your Replit account</p>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            data-testid="button-continue-replit"
          >
            Continue with Replit
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <p>No account needed - Replit handles registration automatically</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
