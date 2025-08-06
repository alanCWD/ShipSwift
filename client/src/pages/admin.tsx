import { useState } from 'react';
import Navbar from '../components/layout/navbar';
import SettingsPanel from '../components/admin/settings-panel';
import AdvancedMarkupConfig from '../components/admin/advanced-markup-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ABLP Admin Panel</h1>
          <p className="text-gray-600">Complete platform management and markup configuration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">API & System Settings</TabsTrigger>
            <TabsTrigger value="markups">Intelligent Markup Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
          
          <TabsContent value="markups">
            <AdvancedMarkupConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
