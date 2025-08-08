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
import { Package, Eye, Upload, Image as ImageIcon } from 'lucide-react';
import type { ClientBranding } from '@shared/schema';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';

interface BrandingResponse {
  branding?: ClientBranding | null;
}

export default function ClientBranding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    companyName: '',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    supportEmail: '',
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // Load current branding
  const { data: branding, isLoading } = useQuery<BrandingResponse>({
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
        supportEmail: brandingData.supportEmail || '',
      });
      setCurrentLogoUrl(brandingData.logoUrl || null);
    }
  }, [branding]);

  // Save branding settings
  const saveBrandingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/branding', data);
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
      setCurrentLogoUrl(data.logoUrl);
      setLogoFile(null);
      setLogoPreview(null);
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

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">White-Label Shipping Labels</h1>
            <p className="text-muted-foreground">Customize how your company branding appears on shipping labels sent to your end customers</p>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Company details that appear on shipping labels</CardDescription>
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
              <p className="text-xs text-gray-500 mt-1">
                This will appear as the sender on shipping labels
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Company Logo
            </CardTitle>
            <CardDescription>Upload your company logo to appear on shipping labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Preview */}
            {(currentLogoUrl || logoPreview) && (
              <div className="space-y-2">
                <Label>Current Logo</Label>
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <img 
                    src={logoPreview || currentLogoUrl || ''} 
                    alt="Company Logo" 
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Logo Upload Input */}
            <div className="space-y-2">
              <Label htmlFor="logo">Upload New Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Recommended: PNG or JPG, max 2MB, square format works best
              </p>
            </div>
            
            {/* Upload Button */}
            {logoFile && (
              <Button 
                onClick={handleUploadLogo}
                disabled={uploadLogoMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle>Label Colors</CardTitle>
            <CardDescription>Colors for branded elements on shipping labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for header and accent elements
                </p>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for borders and subtle elements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card>
          <CardHeader>
            <CardTitle>Support Contact</CardTitle>
            <CardDescription>Contact information displayed on shipping labels</CardDescription>
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
              <p className="text-xs text-gray-500 mt-1">
                Customers can contact this email for shipping inquiries
              </p>
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
          <CardDescription>Preview how your branding will appear on shipping labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            {/* Shipping Label Preview */}
            <div className="border-2 border-gray-300 bg-white p-4 max-w-md mx-auto" style={{ aspectRatio: '4/6' }}>
              {/* Header with logo and company */}
              <div 
                className="border-b-2 pb-3 mb-4 text-center"
                style={{ borderColor: formData.primaryColor }}
              >
                {(logoPreview || currentLogoUrl) && (
                  <div className="flex justify-center mb-2">
                    <img 
                      src={logoPreview || currentLogoUrl || ''} 
                      alt="Company Logo" 
                      className="h-8 object-contain"
                    />
                  </div>
                )}
                <div 
                  className="font-bold text-lg"
                  style={{ color: formData.primaryColor }}
                >
                  {formData.companyName || 'Your Company'}
                </div>
                <div className="text-xs text-gray-600">SHIPPING LABEL</div>
              </div>
              
              {/* Sample shipping info */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-gray-700">FROM:</div>
                  <div className="text-gray-600">
                    {formData.companyName || 'Your Company'}<br/>
                    123 Business St<br/>
                    Vancouver, BC V6B 1A1
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold text-gray-700">TO:</div>
                  <div className="text-gray-600">
                    Customer Name<br/>
                    456 Customer Ave<br/>
                    Toronto, ON M5V 2H1
                  </div>
                </div>
                
                <div 
                  className="border-t pt-2 mt-3"
                  style={{ borderColor: formData.secondaryColor }}
                >
                  <div className="font-semibold text-gray-700">TRACKING: CP123456789CA</div>
                  <div className="text-gray-600">Service: Expedited Parcel</div>
                </div>
                
                {formData.supportEmail && (
                  <div className="border-t pt-2 mt-3 text-center" style={{ borderColor: formData.secondaryColor }}>
                    <div className="text-gray-600">
                      Questions? {formData.supportEmail}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              This is how your white-label shipping labels will appear to your end customers
            </p>
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
          {saveBrandingMutation.isPending ? 'Saving...' : 'Save Label Settings'}
        </Button>
      </div>
      </div>
      
      <Footer />
    </div>
  );
}