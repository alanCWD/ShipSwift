import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Palette, Eye } from 'lucide-react';

interface ClientBranding {
  id: string;
  userId: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  customDomain?: string;
  trackingPageTitle: string;
  trackingPageDescription?: string;
  footerText?: string;
  supportEmail?: string;
  supportPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Branding() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    companyName: '',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    customDomain: '',
    trackingPageTitle: 'Track Your Shipment',
    trackingPageDescription: '',
    footerText: '',
    supportEmail: '',
    supportPhone: '',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load current branding
  const { data: branding, isLoading } = useQuery<{ branding: ClientBranding | null }>({
    queryKey: ['/api/branding'],
  });

  // Load branding data into form - CORRECTED STRUCTURE
  useEffect(() => {
    if (branding?.branding) {
      const brandingData = branding.branding;
      setFormData({
        companyName: brandingData.companyName || '',
        primaryColor: brandingData.primaryColor || '#007bff',
        secondaryColor: brandingData.secondaryColor || '#6c757d',
        backgroundColor: brandingData.backgroundColor || '#ffffff',
        textColor: brandingData.textColor || '#000000',
        customDomain: brandingData.customDomain || '',
        trackingPageTitle: brandingData.trackingPageTitle || 'Track Your Shipment',
        trackingPageDescription: brandingData.trackingPageDescription || '',
        footerText: brandingData.footerText || '',
        supportEmail: brandingData.supportEmail || '',
        supportPhone: brandingData.supportPhone || '',
      });
    }
  }, [branding]);

  // Handle logout with proper navigation
  const handleLogout = async () => {
    console.log('Starting logout process...');
    
    // First log out the user
    await logout();
    console.log('Logout successful');
    
    // Force a complete page refresh to home
    console.log('Forcing page refresh to home...');
    window.location.assign('/');
  };

  // Save branding settings
  const saveBrandingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('/api/branding', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Branding settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save branding settings",
        variant: "destructive",
      });
    },
  });

  // Upload logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      uploadLogoMutation.mutate(file);
    }
  };

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access branding settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Brand Customization</h1>
            <p className="text-muted-foreground mt-2">
              Customize your tracking interface with your company's branding
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic company details for your branded interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                <Input
                  id="customDomain"
                  value={formData.customDomain}
                  onChange={(e) => handleInputChange('customDomain', e.target.value)}
                  placeholder="tracking.yourcompany.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload - CORRECTED LOGO DISPLAY */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>Upload your company logo for the tracking interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branding?.branding?.logoUrl && (
                  <div className="p-4 border rounded-lg">
                    <img 
                      src={branding.branding.logoUrl} 
                      alt="Company Logo" 
                      className="max-h-20 object-contain"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="logo">Upload New Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadLogoMutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: PNG or SVG format, max 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Customize colors to match your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => handleInputChange('textColor', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Page Content */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking Page Content</CardTitle>
              <CardDescription>Customize the content on your tracking page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trackingPageTitle">Page Title</Label>
                <Input
                  id="trackingPageTitle"
                  value={formData.trackingPageTitle}
                  onChange={(e) => handleInputChange('trackingPageTitle', e.target.value)}
                  placeholder="Track Your Shipment"
                />
              </div>
              
              <div>
                <Label htmlFor="trackingPageDescription">Page Description (Optional)</Label>
                <Textarea
                  id="trackingPageDescription"
                  value={formData.trackingPageDescription}
                  onChange={(e) => handleInputChange('trackingPageDescription', e.target.value)}
                  placeholder="Enter your tracking number to see shipment details..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="supportEmail">Support Email (Optional)</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  placeholder="support@yourcompany.com"
                />
              </div>
              
              <div>
                <Label htmlFor="supportPhone">Support Phone (Optional)</Label>
                <Input
                  id="supportPhone"
                  type="tel"
                  value={formData.supportPhone}
                  onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="footerText">Footer Text (Optional)</Label>
                <Input
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => handleInputChange('footerText', e.target.value)}
                  placeholder="© 2025 Your Company"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section - CORRECTED LOGO DISPLAY */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
            <CardDescription>Preview how your branding will look to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border rounded-lg"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
              }}
            >
              <div className="text-center space-y-4">
                {branding?.branding?.logoUrl && (
                  <img 
                    src={branding.branding.logoUrl} 
                    alt="Company Logo" 
                    className="mx-auto max-h-16 object-contain"
                  />
                )}
                
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: formData.primaryColor }}
                >
                  {formData.trackingPageTitle}
                </h2>
                
                {formData.trackingPageDescription && (
                  <p className="text-sm opacity-80">
                    {formData.trackingPageDescription}
                  </p>
                )}
                
                <div 
                  className="inline-block px-4 py-2 rounded"
                  style={{ backgroundColor: formData.primaryColor, color: '#ffffff' }}
                >
                  Track Package
                </div>
                
                <div className="mt-6 pt-4 border-t text-sm opacity-60">
                  {formData.supportEmail && (
                    <span>Email: {formData.supportEmail}</span>
                  )}
                  {formData.supportEmail && formData.supportPhone && ' | '}
                  {formData.supportPhone && (
                    <span>Phone: {formData.supportPhone}</span>
                  )}
                  {formData.footerText && (
                    <div className="mt-2">{formData.footerText}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSaveBranding} 
            disabled={saveBrandingMutation.isPending}
            className="min-w-32"
          >
            {saveBrandingMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}