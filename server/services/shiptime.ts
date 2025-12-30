interface ShipTimeAddress {
  countryCode: string;
  postalCode: string;
  companyName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  attention?: string;
  phone?: string;
}

interface PackageDetails {
  length: number;
  width: number;
  height: number;
  weight: number;
  // Pallet-specific fields
  palletCount?: number;
  palletType?: string;
  isStackable?: boolean;
  freightClass?: string;
  // LTL accessorial services
  fromResidential?: boolean;
  toResidential?: boolean;
  fromTailgate?: boolean;
  toTailgate?: boolean;
}

interface RateRequest {
  from: ShipTimeAddress;
  to: ShipTimeAddress;
  packageDetails: PackageDetails;
  shipmentType?: 'package' | 'pallet';
}

interface PickupDetails {
  // Legacy field name (ShipTime's expected name)
  pickupType?: 'SCHEDULED' | 'DROPOFF';
  // Frontend field name - needs to be mapped to pickupType
  pickupOption?: 'schedule_now' | 'schedule_later' | 'drop_off';
  pickupDate?: Date | string;
  readyTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
  // ShipTime expects closeTime, frontend sends closingTime
  closeTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
  closingTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
}

interface ShipmentRequest extends RateRequest {
  rateId: string;
  carrierName: string;
  serviceName: string;
  carrierId?: string;
  serviceId?: string;
  referenceNumber?: string;
  pickupDetails?: PickupDetails;
}

interface ShipTimeRate {
  rateId: string;
  quoteId?: string;
  carrierId?: string;
  serviceId?: string;
  carrier: { name: string };
  service: { name: string };
  baseCharge: { amount: number };
  surcharges?: Array<{ name?: string; price: { amount: number } }>;
  taxes?: Array<{ price: { amount: number } }>;
  deliveryDays?: number;
}

interface ShipTimeShipment {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  carrier: { name: string };
  service: { name: string };
}

class ShipTimeService {
  private apiUrl: string;
  private sandboxApiUrl: string;
  private username?: string;
  private password?: string;
  private environment?: string;
  
  constructor() {
    // Production and sandbox endpoints
    this.apiUrl = 'https://restapi.shiptime.com/rest/';
    this.sandboxApiUrl = 'https://sandboxapi.shiptime.com/rest/';
    console.log('ShipTimeService initialized for dynamic credentials');
  }

  // Clear credentials cache (for testing)
  async clearCredentials() {
    this.username = undefined;
    this.password = undefined;
    this.environment = undefined;
  }

  // Load credentials from database settings or environment variables
  async loadCredentials() {
    // First try database settings (priority for admin-configured credentials)
    try {
      const { storage } = await import('../storage');
      
      const username = await storage.getSetting('SHIPTIME_USERNAME');
      const password = await storage.getSetting('SHIPTIME_PASSWORD');
      const environment = await storage.getSetting('SHIPTIME_ENVIRONMENT') || 'production';
      
      if (username && password) {
        this.username = username;
        this.password = password;
        this.environment = environment;
        console.log('ShipTime credentials loaded from database for username:', this.username, 'environment:', this.environment);
        console.log('Using API URL:', this.getApiUrl());
        return true;
      }
    } catch (error) {
      console.log('Database settings not available, checking environment variables...');
    }
    
    // Fallback to new environment variables
    if (process.env.SHIPTIME_USERNAME && process.env.SHIPTIME_PASSWORD) {
      this.username = process.env.SHIPTIME_USERNAME;
      this.password = process.env.SHIPTIME_PASSWORD;
      this.environment = process.env.SHIPTIME_ENVIRONMENT || 'production';
      console.log('ShipTime credentials loaded from environment variables for username:', this.username);
      return true;
    }
    
    // Fallback to old environment variables
    if (process.env.SHIPTIME_EMAIL && process.env.SHIPTIME_PASS) {
      this.username = process.env.SHIPTIME_EMAIL;
      this.password = process.env.SHIPTIME_PASS;
      this.environment = 'production';
      console.log('ShipTime credentials loaded from legacy environment variables for username:', this.username);
      return true;
    }
    
    console.warn('ShipTime credentials not configured in system settings or environment variables');
    return false;
  }

  private getBasicAuthHeader(): string {
    if (!this.username || !this.password) {
      throw new Error('ShipTime credentials not configured');
    }

    // Create Basic Auth header as per ShipTime API documentation
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private getApiUrl(): string {
    return this.environment === 'sandbox' ? this.sandboxApiUrl : this.apiUrl;
  }

  private async getFetchOptions(method: string, body?: any): Promise<any> {
    const https = await import('https');
    const options: any = {
      method,
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    };
    
    // For sandbox environment, disable SSL verification due to certificate issues
    if (this.environment === 'sandbox') {
      options.agent = new https.Agent({
        rejectUnauthorized: false
      });
    }
    
    return options;
  }

  private async makeRequest(endpoint: string, method: string = 'POST', body?: any) {
    // Load credentials from database if not already loaded
    if (!this.username || !this.password) {
      const loaded = await this.loadCredentials();
      if (!loaded) {
        throw new Error('ShipTime credentials not configured in system settings');
      }
    }
    
    const apiUrl = this.getApiUrl();
    console.log(`ShipTime API request to ${this.environment || 'production'} environment:`, `${apiUrl}${endpoint}`);
    console.log('Using credentials:', this.username);
    
    const fetchOptions = await this.getFetchOptions(method, body);
    const response = await fetch(`${apiUrl}${endpoint}`, fetchOptions);

    const responseText = await response.text();
    
    // Check if response is HTML (usually error pages)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error(`ShipTime API returned HTML instead of JSON (${response.status}):`, responseText.substring(0, 200));
      
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid ShipTime credentials');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found: Check ShipTime API URL or credentials');
      } else if (response.status >= 500) {
        throw new Error(`ShipTime server error (${response.status}): Service temporarily unavailable`);
      } else {
        throw new Error(`ShipTime API error (${response.status}): Server returned HTML instead of JSON`);
      }
    }
    
    if (!response.ok) {
      console.error(`ShipTime API error (${response.status}):`, responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || errorData.error || responseText;
        throw new Error(`ShipTime API error (${response.status}): ${errorMessage}`);
      } catch (parseError) {
        throw new Error(`ShipTime API error (${response.status}): ${responseText}`);
      }
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse ShipTime API response:', responseText);
      throw new Error('Invalid JSON response from ShipTime API');
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      // Try a complete rates request with all required fields
      const completeRatesRequest = {
        from: {
          companyName: 'GoABLP',
          streetAddress: '44322 Yale Rd #3',
          city: 'Chilliwack',
          state: 'BC',
          countryCode: 'CA',
          postalCode: 'V2R4H1',
          attention: 'GoABLP',
          phone: '1-800-225-7564'
        },
        to: {
          companyName: 'Test Customer',
          streetAddress: '123 West Hastings St',
          city: 'Vancouver',
          state: 'BC',
          countryCode: 'CA', 
          postalCode: 'V6B1A1',
          attention: 'Test Customer',
          phone: '604-555-0123'
        },
        packageType: 'PACKAGE',
        unitOfMeasurement: 'METRIC',
        lineItems: [{
          length: 30,
          width: 20,
          height: 10,
          weight: 1,
        }],
        shipDate: new Date().toISOString(),
      };
      
      const response = await this.makeRequest('rates', 'POST', completeRatesRequest);
      console.log('ShipTime connection test successful, received rates:', response.availableRates?.length || 0);
      return true;
    } catch (testError: any) {
      console.error('ShipTime connection test failed:', testError.message);
      throw testError;
    }
  }

  async getRates(request: RateRequest): Promise<ShipTimeRate[]> {
    try {
      const isPallet = request.shipmentType === 'pallet';
      const packageType = isPallet ? 'PALLET' : 'PACKAGE';
      
      // Normalize postal codes - ShipTime API requires no spaces
      const normalizePostalCode = (code: string) => {
        return code?.replace(/\s+/g, '').toUpperCase() || '';
      };
      
      const fromPostalCode = normalizePostalCode(request.from.postalCode);
      const toPostalCode = normalizePostalCode(request.to.postalCode);
      
      // Build line items based on shipment type
      const lineItems: any[] = [];
      
      if (isPallet && request.packageDetails.palletCount) {
        // Validate pallet shipment data
        if (request.packageDetails.palletCount <= 0) {
          throw new Error('Pallet count must be greater than 0');
        }
        if (!request.packageDetails.weight || request.packageDetails.weight <= 0) {
          throw new Error('Weight must be greater than 0 for pallet shipments');
        }
        
        // For pallets, distribute total weight across all pallets
        // If total weight is 500kg and palletCount is 2, each pallet gets 250kg
        // Round to 3 decimal places (ShipTime API requirement)
        const weightPerPallet = Math.round((request.packageDetails.weight / request.packageDetails.palletCount) * 1000) / 1000;
        
        // Determine freight class - default to 70 (common general freight) if not provided
        // Day & Ross and other LTL carriers require freight class for rate quotes
        const freightClass = request.packageDetails.freightClass || '70';
        
        console.log(`🚚 LTL Pallet request: ${request.packageDetails.palletCount} pallets, freightClass=${freightClass}`);
        
        for (let i = 0; i < request.packageDetails.palletCount; i++) {
          const item: any = {
            length: Math.round(request.packageDetails.length * 1000) / 1000,
            width: Math.round(request.packageDetails.width * 1000) / 1000,
            height: Math.round(request.packageDetails.height * 1000) / 1000,
            weight: weightPerPallet,
            freightClass: freightClass,
            description: 'Pallet',
          };
          
          lineItems.push(item);
        }
      } else {
        // Standard package - single line item
        // Round to 3 decimal places (ShipTime API requirement)
        lineItems.push({
          length: Math.round(request.packageDetails.length * 1000) / 1000,
          width: Math.round(request.packageDetails.width * 1000) / 1000,
          height: Math.round(request.packageDetails.height * 1000) / 1000,
          weight: Math.round(request.packageDetails.weight * 1000) / 1000,
        });
      }
      
      const payload: any = {
        from: {
          countryCode: request.from.countryCode,
          postalCode: fromPostalCode,
          ...(request.from.companyName && { companyName: request.from.companyName }),
          ...(request.from.streetAddress && {
            streetAddress: request.from.streetAddress,
            city: request.from.city,
            state: request.from.state,
            attention: request.from.attention,
            phone: request.from.phone,
          }),
          // Add residential flag for pickup
          ...(request.packageDetails.fromResidential !== undefined && {
            residential: request.packageDetails.fromResidential
          })
        },
        to: {
          countryCode: request.to.countryCode,
          postalCode: toPostalCode,
          ...(request.to.companyName && { companyName: request.to.companyName }),
          ...(request.to.streetAddress && {
            streetAddress: request.to.streetAddress,
            city: request.to.city,
            state: request.to.state,
            attention: request.to.attention,
            phone: request.to.phone,
          }),
          // Add residential flag for delivery
          ...(request.packageDetails.toResidential !== undefined && {
            residential: request.packageDetails.toResidential
          })
        },
        packageType,
        unitOfMeasurement: 'METRIC',
        lineItems,
        shipDate: new Date().toISOString(),
      };
      
      // Add LTL service options for freight shipments
      if (isPallet) {
        const serviceOptions: string[] = [];
        
        if (request.packageDetails.fromTailgate) {
          serviceOptions.push('TAILGATE_ORIGIN');
        }
        if (request.packageDetails.toTailgate) {
          serviceOptions.push('TAILGATE_DESTINATION');
        }
        
        if (serviceOptions.length > 0) {
          payload.serviceOptions = serviceOptions;
        }
      }
      
      // Note: ShipTime API doesn't support palletType/stackable fields
      // The packageType: "PALLET" is sufficient to indicate pallet shipments
      // Pallet-specific metadata is stored in our database for reference only

      console.log(`Fetching ${packageType} rates with payload:`, JSON.stringify(payload, null, 2));
      const response = await this.makeRequest('rates', 'POST', payload);
      
      // Log full response for debugging missing carriers
      console.log(`📦 ShipTime API raw response:`, JSON.stringify(response, null, 2).substring(0, 2000));
      
      if (!response.availableRates || response.availableRates.length === 0) {
        console.log(`⚠️ No rates returned from ShipTime API. Full response:`, JSON.stringify(response));
        throw new Error('No shipping rates available for this route');
      }

      // Log all carriers returned for debugging
      const carriers = response.availableRates.map((r: any) => r.carrier?.name || r.carrierName || 'Unknown').filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
      console.log(`📦 Carriers returned by ShipTime: ${carriers.join(', ')}`);
      console.log(`Received ${response.availableRates.length} ${packageType} rates from ShipTime API:`);
      response.availableRates.forEach((rate: any, index: number) => {
        console.log(`  Rate ${index + 1}: ${rate.carrier?.name || rate.carrierName} - ${rate.service?.name || rate.serviceName}`);
        console.log(`    baseCharge: ${rate.baseCharge?.amount || 'N/A'} (${rate.baseCharge?.currency || 'N/A'})`);
        console.log(`    Total surcharges: ${rate.surcharges?.length || 0}, Total taxes: ${rate.taxes?.length || 0}`);
        console.log(`    Transit time fields: deliveryDays=${rate.deliveryDays}, transitTime=${rate.transitTime}, transitDays=${rate.transitDays}, estimatedDeliveryDate=${rate.estimatedDeliveryDate}`);
        console.log(`    IDs: id=${rate.id}, quoteId=${rate.quoteId}, carrier.id=${rate.carrier?.id}, service.id=${rate.service?.id}`);
        console.log(`    All rate keys:`, Object.keys(rate).join(', '));
      });

      // Transform rates to include normalized field names for shipment creation
      const transformedRates = response.availableRates.map((rate: any) => ({
        ...rate,
        quoteId: rate.id || rate.quoteId,
        carrierId: rate.carrier?.id || rate.carrierId,
        serviceId: rate.service?.id || rate.serviceId,
        carrierName: rate.carrier?.name || rate.carrierName,
        serviceName: rate.service?.name || rate.serviceName,
      }));

      return transformedRates;
    } catch (error) {
      console.error('ShipTime getRates error:', error);
      throw error;
    }
  }

  async createShipment(request: ShipmentRequest): Promise<ShipTimeShipment> {
    try {
      // Validate required shipment data
      console.log('🔍 Validating shipment request...');
      console.log('  shipmentType:', request.shipmentType);
      console.log('  packageDetails:', JSON.stringify(request.packageDetails, null, 2));
      
      if (!request.rateId) {
        throw new Error('Missing rateId (quoteId). Please get a fresh rate quote.');
      }
      
      // Add environment-specific special instructions
      const isSandbox = this.environment === 'sandbox';
      const specialInstructions = isSandbox 
        ? 'Test booking Not for Pick up - SANDBOX TESTING ONLY'
        : undefined;

      const isPallet = request.shipmentType === 'pallet';
      const packageType = isPallet ? 'PALLET' : 'PACKAGE';
      
      // Validate pallet-specific requirements
      if (isPallet) {
        if (!request.packageDetails.palletCount || request.packageDetails.palletCount <= 0) {
          console.error('❌ Pallet shipment missing palletCount');
          throw new Error('Pallet shipment requires palletCount. Please get a fresh pallet rate quote.');
        }
        console.log(`✅ Pallet shipment validated: ${request.packageDetails.palletCount} pallets`);
      }
      
      // Normalize postal codes - ShipTime API requires no spaces
      const normalizePostalCode = (code: string) => {
        return code?.replace(/\s+/g, '').toUpperCase() || '';
      };
      
      const fromPostalCode = normalizePostalCode(request.from.postalCode);
      const toPostalCode = normalizePostalCode(request.to.postalCode);
      
      // Build line items based on shipment type
      const lineItems: any[] = [];
      
      if (isPallet && request.packageDetails.palletCount) {
        // Validate pallet shipment data
        if (request.packageDetails.palletCount <= 0) {
          throw new Error('Pallet count must be greater than 0');
        }
        if (!request.packageDetails.weight || request.packageDetails.weight <= 0) {
          throw new Error('Weight must be greater than 0 for pallet shipments');
        }
        
        // For pallets, distribute total weight across all pallets
        // If total weight is 500kg and palletCount is 2, each pallet gets 250kg
        // Round to 3 decimal places (ShipTime API requirement)
        const weightPerPallet = Math.round((request.packageDetails.weight / request.packageDetails.palletCount) * 1000) / 1000;
        
        // Determine freight class - default to 70 (common general freight) if not provided
        const freightClass = request.packageDetails.freightClass || '70';
        
        for (let i = 0; i < request.packageDetails.palletCount; i++) {
          const item: any = {
            length: Math.round(request.packageDetails.length * 1000) / 1000,
            width: Math.round(request.packageDetails.width * 1000) / 1000,
            height: Math.round(request.packageDetails.height * 1000) / 1000,
            weight: weightPerPallet,
            freightClass: freightClass,
            description: 'Pallet',
          };
          
          lineItems.push(item);
        }
      } else {
        // Standard package - single line item
        // Round to 3 decimal places (ShipTime API requirement)
        lineItems.push({
          length: Math.round(request.packageDetails.length * 1000) / 1000,
          width: Math.round(request.packageDetails.width * 1000) / 1000,
          height: Math.round(request.packageDetails.height * 1000) / 1000,
          weight: Math.round(request.packageDetails.weight * 1000) / 1000,
        });
      }

      // Build the rateRequest object that wraps the shipment details
      const rateRequest: any = {
        from: {
          attention: request.from.attention || 'GoABLP',
          companyName: request.from.companyName || 'GoABLP',
          streetAddress: request.from.streetAddress || '44322 Yale Rd #3',
          city: request.from.city || 'Chilliwack',
          state: request.from.state || 'BC',
          countryCode: request.from.countryCode,
          postalCode: fromPostalCode,
          phone: request.from.phone || '1-800-225-7564',
        },
        to: {
          attention: request.to.attention || 'Customer',
          companyName: request.to.companyName || '',
          streetAddress: request.to.streetAddress!,
          city: request.to.city!,
          state: request.to.state!,
          countryCode: request.to.countryCode,
          postalCode: toPostalCode,
          phone: request.to.phone || '',
        },
        packageType,
        unitOfMeasurement: 'METRIC',
        lineItems,
        shipDate: new Date().toISOString().split('T')[0],
      };
      
      // Add LTL service options for freight shipments
      if (isPallet) {
        const serviceOptions: string[] = [];
        if (request.packageDetails.fromTailgate) {
          serviceOptions.push('TAILGATE_ORIGIN');
        }
        if (request.packageDetails.toTailgate) {
          serviceOptions.push('TAILGATE_DESTINATION');
        }
        if (serviceOptions.length > 0) {
          rateRequest.serviceOptions = serviceOptions;
        }
      }

      // ShipTime API accepts either:
      // 1. Just quoteId (simplest, uses the saved quote)
      // 2. rateRequest + carrierId + serviceId (builds a new shipment)
      // We use quoteId when available for consistency with rate quote
      const payload: any = {
        quoteId: request.rateId,
        rateRequest,
        carrierId: request.carrierId || undefined,
        serviceId: request.serviceId || undefined,
        // Reference fields for tracking
        ref1: request.referenceNumber || undefined,
      };
      
      // Build pickupDetail - required by ShipTime API for shipment creation
      // Known ShipTime fields: readyTime, pickupDate, closeTime, type
      // NOTE: "pickupTip" is a monetary gratuity field (MoneyAmountModel), NOT the pickup type
      // The pickup type field is likely just "type" based on standard API patterns
      const pickupDetail: any = {};
      
      // Normalize pickup option/type to ShipTime's type field
      // Frontend sends pickupOption: 'schedule_now' | 'schedule_later' | 'drop_off'
      // ShipTime expects type: 'SCHEDULED' | 'DROPOFF' (or similar)
      let pickupType: 'SCHEDULED' | 'DROPOFF' = 'DROPOFF';
      
      if (request.pickupDetails?.pickupOption) {
        // Map frontend pickupOption to ShipTime type
        if (request.pickupDetails.pickupOption === 'drop_off') {
          pickupType = 'DROPOFF';
        } else {
          // schedule_now or schedule_later both map to SCHEDULED
          pickupType = 'SCHEDULED';
        }
      } else if (request.pickupDetails?.pickupType) {
        // Legacy support: if pickupType is provided directly
        pickupType = request.pickupDetails.pickupType;
      } else if (request.pickupDetails?.pickupDate) {
        // If date is provided but no type, assume scheduled
        pickupType = 'SCHEDULED';
      }
      
      // Use "type" field for ShipTime API (not pickupType or pickupTip)
      pickupDetail.type = pickupType;
      
      // Add pickup date if provided
      if (request.pickupDetails?.pickupDate) {
        const pickupDate = new Date(request.pickupDetails.pickupDate);
        pickupDetail.pickupDate = pickupDate.toISOString().split('T')[0];
        
        // Format ready time (when package is ready for pickup)
        if (request.pickupDetails.readyTime) {
          const { hour, minute, period } = request.pickupDetails.readyTime;
          let hourNum = parseInt(hour);
          if (period === 'PM' && hourNum !== 12) hourNum += 12;
          if (period === 'AM' && hourNum === 12) hourNum = 0;
          pickupDetail.readyTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
        } else {
          pickupDetail.readyTime = '09:00';
        }
        
        // Format close time (last time for pickup)
        // Frontend sends closingTime, ShipTime expects closeTime
        const closeTimeData = request.pickupDetails.closeTime || request.pickupDetails.closingTime;
        if (closeTimeData) {
          const { hour, minute, period } = closeTimeData;
          let hourNum = parseInt(hour);
          if (period === 'PM' && hourNum !== 12) hourNum += 12;
          if (period === 'AM' && hourNum === 12) hourNum = 0;
          pickupDetail.closeTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
        } else {
          pickupDetail.closeTime = '17:00';
        }
      }
      
      // Add special instructions for sandbox testing
      if (specialInstructions) {
        pickupDetail.specialInstructions = specialInstructions;
      }
      
      // Always include pickupDetail in payload
      payload.pickupDetail = pickupDetail;

      console.log('📦 Creating ShipTime shipment with payload:');
      console.log('  RateId:', request.rateId);
      console.log('  Carrier:', request.carrierName);
      console.log('  Service:', request.serviceName);
      console.log('  Environment:', this.environment);
      console.log('  API URL:', this.getApiUrl());
      console.log('  Full payload:', JSON.stringify(payload, null, 2));

      const response = await this.makeRequest('shipments', 'POST', payload);
      
      console.log('📦 ShipTime shipment response:');
      console.log('  Response:', JSON.stringify(response, null, 2));
      
      // Auto-cancel sandbox shipments immediately to prevent charges
      if (isSandbox && response.shipmentId) {
        console.log(`Auto-cancelling sandbox shipment ${response.shipmentId} to prevent charges`);
        try {
          await this.cancelShipment(response.shipmentId);
          console.log(`Successfully cancelled sandbox shipment ${response.shipmentId}`);
          
          // Add cancellation note to response
          response.autocancelled = true;
          response.cancellationReason = 'Automatic sandbox cancellation to prevent charges';
        } catch (cancelError) {
          console.error(`Failed to auto-cancel sandbox shipment ${response.shipmentId}:`, cancelError);
          // Continue anyway - shipment was created but cancellation failed
        }
      }

      if (!response.id || !response.labelUrl) {
        throw new Error('Invalid shipment response from ShipTime');
      }

      return {
        id: response.id,
        trackingNumber: response.trackingNumber || '',
        labelUrl: response.labelUrl,
        carrier: response.carrier || { name: request.carrierName },
        service: response.service || { name: request.serviceName },
      };
    } catch (error) {
      console.error('ShipTime createShipment error:', error);
      throw error;
    }
  }

  // Cancel a shipment
  async cancelShipment(shipmentId: string): Promise<void> {
    try {
      await this.makeRequest(`shipments/${shipmentId}/cancel`, 'POST');
    } catch (error: any) {
      console.error('ShipTime cancel shipment error:', error.message);
      throw error;
    }
  }

  async trackShipment(shipmentId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`shipments/${shipmentId}/track`, 'GET');
      return response;
    } catch (error) {
      console.error('ShipTime trackShipment error:', error);
      throw error;
    }
  }
}

export const shiptimeService = new ShipTimeService();
