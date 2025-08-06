import { useState } from 'react';
import Navbar from '../components/layout/navbar';
import SettingsPanel from '../components/admin/settings-panel';
import RateMarkupConfig from '../components/admin/rate-markup-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage system settings and configurations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="markups">Rate Markups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
          
          <TabsContent value="markups">
            <RateMarkupConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
