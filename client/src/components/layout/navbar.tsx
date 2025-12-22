import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, Package, Palette, Cannabis, Receipt } from 'lucide-react';
import goAblpLogo from '@assets/GO ABLP logo (500 x 300 px)_1760196935840.png';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function Navbar({ onLogin, onRegister }: NavbarProps) {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    console.log('🚪 Navbar logout clicked - immediate redirect');
    // Immediate redirect - don't wait for anything
    window.location.href = '/';
    // Background logout call (optional)
    logout().catch(() => {});
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-28' : 'h-36'}`}>
          <div className="flex items-center flex-1">
            <Link href="/home" className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src={goAblpLogo} 
                alt="GoABLP" 
                className={`transition-all duration-300 ${isScrolled ? 'h-[108px]' : 'h-[120px]'}`}
                data-testid="img-logo"
              />
            </Link>
            
            {user && (
              <div className="hidden md:flex ml-10">
                <div className="flex items-baseline space-x-8">
                  <Link 
                    href="/dashboard" 
                    className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/shipments" 
                    className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Shipments
                  </Link>
                  <Link 
                    href="/track" 
                    className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Tracking
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={onLogin}
                  className="text-gray-500 hover:text-blue-600"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={onRegister}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Get Started
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="font-medium text-gray-900 text-sm">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : user.email
                        }
                      </p>
                      {user.companyName && (
                        <p className="text-gray-500 text-xs">{user.companyName}</p>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex w-full">
                      <Receipt className="mr-2 h-4 w-4" />
                      Billing & Invoices
                    </Link>
                  </DropdownMenuItem>
                  {(user.blazeAccess || user.role === 'admin' || user.role === 'ablp_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/blaze" className="flex w-full">
                        <Cannabis className="mr-2 h-4 w-4 text-green-600" />
                        Blaze Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === 'admin' || user.role === 'ablp_admin') ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/branding" className="flex w-full">
                        <Palette className="mr-2 h-4 w-4" />
                        Branding
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
