import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';
import SettingsPanel from '../components/admin/settings-panel';
import AdvancedMarkupConfig from '../components/admin/advanced-markup-config';
import AdminUsers from './admin/users';
import ApiKeysPage from './admin/api-keys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('settings');
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If not loading and user is not admin, redirect to home
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'ablp_admin'))) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render admin panel if not authorized (will redirect)
  if (!user || (user.role !== 'admin' && user.role !== 'ablp_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GoABLP Admin Panel</h1>
          <p className="text-gray-600">Complete platform management and markup configuration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">API & System Settings</TabsTrigger>
            <TabsTrigger value="markups">Intelligent Markup Rules</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="merchant-keys">Merchant API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
          
          <TabsContent value="markups">
            <AdvancedMarkupConfig />
          </TabsContent>
          
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          
          <TabsContent value="merchant-keys">
            <ApiKeysPage />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
