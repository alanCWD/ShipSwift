import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Eye } from 'lucide-react';

export default function ClientBranding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    companyName: '',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    trackingPageTitle: 'Track Your Shipment',
    trackingPageDescription: '',
    footerText: '',
    supportEmail: '',
    supportPhone: '',
  });

  // Load current branding
  const { data: branding, isLoading } = useQuery({
    queryKey: ['/api/branding'],
  });

  // Load branding data into form
  useEffect(() => {
    if (branding?.branding) {
      const brandingData = branding.branding;
      setFormData({
        companyName: brandingData.companyName || '',
        primaryColor: brandingData.primaryColor || '#007bff',
        secondaryColor: brandingData.secondaryColor || '#6c757d',
        backgroundColor: brandingData.backgroundColor || '#ffffff',
        textColor: brandingData.textColor || '#000000',
        trackingPageTitle: brandingData.trackingPageTitle || 'Track Your Shipment',
        trackingPageDescription: brandingData.trackingPageDescription || '',
        footerText: brandingData.footerText || '',
        supportEmail: brandingData.supportEmail || '',
        supportPhone: brandingData.supportPhone || '',
      });
    }
  }, [branding]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access branding settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Brand Customization</h1>
          <p className="text-muted-foreground">Customize your shipping interface branding for your customers</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            <CardDescription>Customize the content on your tracking pages</CardDescription>
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
                placeholder="Enter your tracking number to see the latest updates..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card>
          <CardHeader>
            <CardTitle>Support Information</CardTitle>
            <CardDescription>Contact details displayed on tracking pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>
            
            <div>
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={formData.supportPhone}
                onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                placeholder="1-800-123-4567"
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

      {/* Preview Section */}
      <Card>
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
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveBranding}
          disabled={saveBrandingMutation.isPending}
          size="lg"
        >
          {saveBrandingMutation.isPending ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </div>
  );
}