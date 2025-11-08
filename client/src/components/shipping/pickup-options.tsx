import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Clock, MapPin, Phone, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const pickupSchema = z.object({
  pickupOption: z.enum(['schedule_now', 'schedule_later', 'drop_off']),
  pickupDate: z.date().optional(),
  contactName: z.string().optional(),
  phoneNumber: z.string().optional(),
  pickupLocation: z.string().optional(),
  readyTime: z.object({
    hour: z.string(),
    minute: z.string(),
    period: z.enum(['AM', 'PM'])
  }).optional(),
  closingTime: z.object({
    hour: z.string(),
    minute: z.string(),
    period: z.enum(['AM', 'PM'])
  }).optional(),
  pickupInstructions: z.string().optional(),
}).superRefine((data, ctx) => {
  // Only validate pickup fields if not drop_off
  if (data.pickupOption !== 'drop_off') {
    if (!data.contactName || data.contactName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact name is required',
        path: ['contactName'],
      });
    }
    if (!data.phoneNumber || data.phoneNumber.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid phone number is required',
        path: ['phoneNumber'],
      });
    }
    if (!data.pickupLocation || data.pickupLocation.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pickup location is required',
        path: ['pickupLocation'],
      });
    }
    if (!data.readyTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ready time is required',
        path: ['readyTime'],
      });
    }
    if (!data.closingTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Closing time is required',
        path: ['closingTime'],
      });
    }
  }
});

type PickupFormData = z.infer<typeof pickupSchema>;

interface PickupOptionsProps {
  onPickupDetailsComplete: (pickupDetails: PickupFormData) => void;
  onBack: () => void;
  rate: any;
  addressData?: any;
}

export default function PickupOptions({ onPickupDetailsComplete, onBack, rate, addressData }: PickupOptionsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const form = useForm<PickupFormData>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      pickupOption: 'schedule_now',
      contactName: '',
      phoneNumber: '',
      pickupLocation: '',
      readyTime: { hour: '10', minute: '00', period: 'AM' },
      closingTime: { hour: '05', minute: '00', period: 'PM' },
      pickupInstructions: '',
    },
  });

  const { watch, setValue } = form;
  const pickupOption = watch('pickupOption');

  const handleSubmit = (data: PickupFormData) => {
    if (data.pickupOption !== 'drop_off' && !selectedDate) {
      form.setError('pickupDate', { message: 'Please select a pickup date' });
      return;
    }
    
    const pickupDetails = {
      ...data,
      pickupDate: selectedDate,
    };
    
    onPickupDetailsComplete(pickupDetails);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          ← Back to Rate Selection
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Pickup Options</h1>
        <p className="text-gray-600 mt-2">
          Choose how you'd like your package picked up for shipping
        </p>
      </div>

      {/* Selected Rate Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Selected Shipping Option</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{rate.carrierName || rate.carrier?.name}</div>
              <div className="text-sm text-gray-600">{rate.serviceName || rate.service?.name}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                ${(() => {
                  // Check for marked-up rate format (has subtotal and taxAmount)
                  if (rate.subtotal !== undefined && rate.taxAmount !== undefined) {
                    const total = Number(rate.subtotal) + Number(rate.taxAmount);
                    return total.toFixed(2);
                  }
                  // Fallback to legacy formats
                  if (rate.totalCharge) return Number(rate.totalCharge).toFixed(2);
                  if (rate.price) return Number(rate.price).toFixed(2);
                  return '0.00';
                })()}
              </div>
              <div className="text-sm text-gray-600">CAD</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Ready for Pickup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ready for Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pickup Options */}
            <div>
              <TooltipProvider>
                <RadioGroup
                  value={pickupOption}
                  onValueChange={(value: any) => setValue('pickupOption', value)}
                  className="flex flex-col space-y-4"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="schedule_now" id="schedule_now" />
                    <label htmlFor="schedule_now" className="flex items-center gap-2 cursor-pointer">
                      <span className="font-medium">Schedule pickup now</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Schedule an immediate pickup for today. The carrier will be notified right away and will attempt pickup during normal business hours.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="schedule_later" id="schedule_later" />
                    <label htmlFor="schedule_later" className="flex items-center gap-2 cursor-pointer">
                      <span className="font-medium">Schedule pickup later</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Choose a future date for pickup. Select the date, time window, and provide contact details for the scheduled pickup.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="drop_off" id="drop_off" />
                    <label htmlFor="drop_off" className="flex items-center gap-2 cursor-pointer">
                      <span className="font-medium">I will drop off the package</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            You will bring the package to a carrier drop-off location or service center. No pickup will be scheduled.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                  </div>
                </RadioGroup>
              </TooltipProvider>
              
              <p className="text-sm text-gray-600 mt-3">
                Please note that carrier pickups are not guaranteed.
              </p>
            </div>

            {/* Pickup Details - Only show if not drop-off */}
            {pickupOption !== 'drop_off' && (
              <div className="space-y-6 border-t pt-6">
                {/* Pickup Date */}
                <div>
                  <Label htmlFor="pickup-date" className="text-base font-medium">
                    Pickup Date*
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < tomorrow}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.pickupDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.pickupDate.message}
                    </p>
                  )}
                </div>

                {/* Contact Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName" className="text-base font-medium">
                      Contact Name*
                    </Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="contactName"
                        {...form.register('contactName')}
                        placeholder="Enter contact name"
                        className="pl-10"
                      />
                    </div>
                    {form.formState.errors.contactName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.contactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-base font-medium">
                      Phone Number*
                    </Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phoneNumber"
                        {...form.register('phoneNumber')}
                        placeholder="250-882-7378"
                        className="pl-10"
                      />
                    </div>
                    {form.formState.errors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pickup Location */}
                <div>
                  <Label htmlFor="pickupLocation" className="text-base font-medium">
                    Pickup Location*
                  </Label>
                  <Select onValueChange={(value) => setValue('pickupLocation', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office/Business</SelectItem>
                      <SelectItem value="residence">Residence</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="retail">Retail Location</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.pickupLocation && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.pickupLocation.message}
                    </p>
                  )}
                </div>

                {/* Time Windows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium">Ready Time*</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Select onValueChange={(value) => setValue('readyTime.hour', value)} defaultValue="10">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select onValueChange={(value) => setValue('readyTime.minute', value)} defaultValue="00">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00">00</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="45">45</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(value) => setValue('readyTime.period', value as 'AM' | 'PM')} defaultValue="AM">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Closing Time*</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Select onValueChange={(value) => setValue('closingTime.hour', value)} defaultValue="05">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select onValueChange={(value) => setValue('closingTime.minute', value)} defaultValue="00">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00">00</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="45">45</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(value) => setValue('closingTime.period', value as 'AM' | 'PM')} defaultValue="PM">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Pickup Instructions */}
                <div>
                  <Label htmlFor="pickupInstructions" className="text-base font-medium">
                    Pickup Instructions (optional)
                  </Label>
                  <Textarea
                    id="pickupInstructions"
                    {...form.register('pickupInstructions')}
                    placeholder="Special instructions for the pickup (e.g., loading dock location, access codes, etc.)"
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="px-8"
          >
            Back
          </Button>
          
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline"
              className="px-6"
            >
              Save as Default
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}