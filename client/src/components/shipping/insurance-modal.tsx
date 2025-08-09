import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';

const insuranceSchema = z.object({
  totalValue: z.string().min(1, 'Total value is required'),
  currency: z.enum(['CAD', 'USD']),
  insuranceType: z.enum(['shipswift', 'carrier']),
  signatureType: z.enum(['signature_required', 'adult_signature_required']).optional(),
  termsAccepted: z.boolean().optional(),
  carrierTermsAccepted: z.boolean().optional(),
});

type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (insuranceData: InsuranceFormData) => void;
  initialData?: Partial<InsuranceFormData>;
}

export default function InsuranceModal({ isOpen, onClose, onSave, initialData }: InsuranceModalProps) {
  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      totalValue: initialData?.totalValue || '',
      currency: initialData?.currency || 'CAD',
      insuranceType: initialData?.insuranceType || 'shipswift',
      signatureType: initialData?.signatureType || 'signature_required',
      termsAccepted: initialData?.termsAccepted || false,
      carrierTermsAccepted: initialData?.carrierTermsAccepted || false,
    },
  });

  const { watch, setValue } = form;
  const insuranceType = watch('insuranceType');
  const termsAccepted = watch('termsAccepted');
  const carrierTermsAccepted = watch('carrierTermsAccepted');

  const handleSave = (data: InsuranceFormData) => {
    // Validate terms acceptance based on insurance type
    if (insuranceType === 'shipswift' && !data.termsAccepted) {
      form.setError('termsAccepted', { message: 'You must accept the insurance terms' });
      return;
    }
    if (insuranceType === 'carrier' && !data.carrierTermsAccepted) {
      form.setError('carrierTermsAccepted', { message: 'You must accept the carrier terms' });
      return;
    }
    
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Edit Insurance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          {/* Total Cost Value Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Total Cost Value of Goods being Shipped</Label>
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <Input
                    placeholder="0.00"
                    {...form.register('totalValue')}
                    className="text-right"
                  />
                  {form.formState.errors.totalValue && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.totalValue.message}
                    </p>
                  )}
                </div>
                <Select value={watch('currency')} onValueChange={(value: 'CAD' | 'USD') => setValue('currency', value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Insurance Type */}
            <div>
              <Label className="text-base font-medium">Insurance Type</Label>
              <RadioGroup
                value={insuranceType}
                onValueChange={(value: 'shipswift' | 'carrier') => setValue('insuranceType', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shipswift" id="shipswift" />
                  <label htmlFor="shipswift" className="font-medium">ShipSwift</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="carrier" id="carrier" />
                  <label htmlFor="carrier" className="font-medium">Carrier</label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* ShipSwift Insurance Options */}
          {insuranceType === 'shipswift' && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Signature is mandatory when adding insurance to your shipment
                </p>
              </div>

              {/* Signature Type */}
              <div>
                <Label className="text-base font-medium">Signature Type</Label>
                <RadioGroup
                  value={watch('signatureType')}
                  onValueChange={(value: 'signature_required' | 'adult_signature_required') => setValue('signatureType', value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="signature_required" id="signature_required" />
                    <label htmlFor="signature_required">Signature Required</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="adult_signature_required" id="adult_signature_required" />
                    <label htmlFor="adult_signature_required">Adult Signature Required</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Terms Acceptance */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setValue('termsAccepted', !!checked)}
                  />
                  <label htmlFor="terms" className="text-sm leading-5">
                    By checking this box, I acknowledge that I have read and accepted the{' '}
                    <a href="/insurance-terms" target="_blank" className="text-blue-600 hover:underline">
                      Additional Insurance Terms
                    </a>
                    , including the list of products that cannot be insured. I also acknowledge that if an accurate description of goods has not been provided, any insurance on the shipment will be void.
                  </label>
                </div>
                {form.formState.errors.termsAccepted && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.termsAccepted.message}
                  </p>
                )}
              </div>

              {/* Liability Notice */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Please note that without the purchase of insurance, the carrier's liability for any loss or damage to your Parcel Shipment will be limited to $2.00 per pound or $100.00 per shipment, whichever is applicable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Carrier Insurance Options */}
          {insuranceType === 'carrier' && (
            <div className="space-y-4 border-t pt-4">
              {/* Carrier Terms */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="carrier-terms"
                    checked={carrierTermsAccepted}
                    onCheckedChange={(checked) => setValue('carrierTermsAccepted', !!checked)}
                  />
                  <label htmlFor="carrier-terms" className="text-sm">
                    I understand and accept that carrier insurance is subject to the respective carrier's terms and conditions of service.
                  </label>
                </div>
                {form.formState.errors.carrierTermsAccepted && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.carrierTermsAccepted.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Insurance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}