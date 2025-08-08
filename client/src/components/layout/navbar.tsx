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
import { User, Settings, LogOut, Package, Palette } from 'lucide-react';

interface NavbarProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function Navbar({ onLogin, onRegister }: NavbarProps) {
  const { user, logout } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-xl">
                SwiftShip
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">Logistics</span>
            </Link>
            
            {user && (
              <div className="hidden md:block ml-10">
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
                  {user.role === 'admin' ? (
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
                  <DropdownMenuItem onClick={logout}>
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
