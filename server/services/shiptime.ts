interface ShipTimeAddress {
  countryCode: string;
  postalCode: string;
  companyName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  attention?: string;
  phone?: string;
  email?: string;
}

// Format phone number to (XXX) XXX-XXXX format required by ShipTime API
function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) {
    return '1-800-225-7564'; // Default fallback
  }
  
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different lengths
  if (digits.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Remove leading 1 and format
    const cleaned = digits.slice(1);
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (digits.length > 10) {
    // Take first 10 digits and format
    const cleaned = digits.slice(0, 10);
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return as-is if we can't normalize it
  return phone;
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
  // Legacy field name
  pickupType?: 'SCHEDULED' | 'DROPOFF';
  // Frontend field name - needs to be mapped
  pickupOption?: 'schedule_now' | 'schedule_later' | 'drop_off';
  pickupDate?: Date | string;
  readyTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
  // ShipTime expects closeTime, frontend sends closingTime
  closeTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
  closingTime?: { hour: string; minute: string; period: 'AM' | 'PM' };
  // ShipTime API pickup location fields
  pickupLocation?: 'FrontDoor' | 'BackDoor' | 'Office' | 'Reception' | 'Warehouse' | 'Other' | string;
  otherLocation?: string; // Description when pickupLocation is 'Other'
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
      console.error(`ShipTime API error (${response.status}) - FULL RESPONSE:`, responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('ShipTime error data object:', JSON.stringify(errorData, null, 2));
        
        // Extract error messages from ShipTime's messages array (common format for validation errors)
        let errorMessage = '';
        if (errorData.messages && Array.isArray(errorData.messages) && errorData.messages.length > 0) {
          errorMessage = errorData.messages
            .map((m: any) => typeof m === 'string' ? m : m.message || m.text || JSON.stringify(m))
            .filter((m: string) => m && m !== '{}' && m !== 'null')
            .join('; ');
        }
        // Check for nested error details (common in carrier rejection responses)
        if (!errorMessage && errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors
            .map((e: any) => typeof e === 'string' ? e : e.message || e.description || JSON.stringify(e))
            .filter((m: string) => m && m !== '{}' && m !== 'null')
            .join('; ');
        }
        // Fallback to other common error fields
        if (!errorMessage) {
          errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorData.detail || '';
        }
        // If still no message, provide a generic one based on status code
        if (!errorMessage) {
          if (response.status === 500) {
            errorMessage = 'Carrier rejected the shipment request. Please verify all required fields are filled correctly.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request data. Please check your shipment details.';
          } else {
            errorMessage = `API returned status ${response.status}`;
          }
        }
        console.error('ShipTime parsed error:', { success: errorData.success, messages: errorData.messages, errors: errorData.errors, errorMessage });
        throw new Error(`ShipTime API error (${response.status}): ${errorMessage}`);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.startsWith('ShipTime API error')) {
          throw parseError;
        }
        throw new Error(`ShipTime API error (${response.status}): ${responseText}`);
      }
    }

    // Some ShipTime endpoints (e.g. cancel) return an empty body on success.
    // Attempting JSON.parse('') throws — treat empty responses as a void success.
    if (!responseText || !responseText.trim()) {
      console.log('📦 ShipTime makeRequest - empty body success response');
      console.log('  Endpoint:', endpoint);
      console.log('  Status:', response.status);
      return null;
    }

    try {
      const parsedResponse = JSON.parse(responseText);
      console.log('📦 ShipTime makeRequest - successful response:');
      console.log('  Endpoint:', endpoint);
      console.log('  Status:', response.status);
      console.log('  Response type:', typeof parsedResponse);
      console.log('  Response keys:', parsedResponse ? Object.keys(parsedResponse) : 'null');
      console.log('  Full response:', JSON.stringify(parsedResponse, null, 2).substring(0, 2000));
      return parsedResponse;
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
        unitOfMeasurement: 'IMPERIAL',
        lineItems: [{
          length: 12,  // 12 inches
          width: 8,    // 8 inches
          height: 4,   // 4 inches
          weight: 2,   // 2 lbs
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
          // ShipTime requires these fields for rate quotes - use defaults if not provided
          companyName: request.to.companyName || 'Recipient',
          attention: request.to.attention || 'Recipient',
          phone: request.to.phone || '1-800-000-0000',
          // Include address details if provided
          ...(request.to.streetAddress && {
            streetAddress: request.to.streetAddress,
            city: request.to.city,
            state: request.to.state,
          }),
          // Add residential flag for delivery
          ...(request.packageDetails.toResidential !== undefined && {
            residential: request.packageDetails.toResidential
          })
        },
        packageType,
        unitOfMeasurement: 'IMPERIAL',
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

      console.log('\n' + '='.repeat(80));
      console.log(`📊 SHIPTIME RATE REQUEST - ${packageType}`);
      console.log('='.repeat(80));
      console.log('Payload:', JSON.stringify(payload, null, 2));
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
        const carrierName = rate.carrier?.name || rate.carrierName;
        const serviceName = rate.service?.name || rate.serviceName;
        console.log(`\n  Rate ${index + 1}: ${carrierName} - ${serviceName}`);
        console.log(`    📋 QuoteId: id="${rate.id}" | quoteId="${rate.quoteId}"`);
        console.log(`    💵 baseCharge: $${rate.baseCharge?.amount || 'N/A'} ${rate.baseCharge?.currency || ''}`);
        console.log(`    📦 Surcharges: ${rate.surcharges?.length || 0}, Taxes: ${rate.taxes?.length || 0}`);
        console.log(`    🚚 Transit: deliveryDays=${rate.deliveryDays}, transitDays=${rate.transitDays}`);
        console.log(`    🔑 CarrierId: ${rate.carrier?.id}, ServiceId: ${rate.service?.id}`);
        
        // Calculate total from surcharges for debugging
        let surchargeTotal = 0;
        if (rate.surcharges?.length > 0) {
          console.log(`    📝 Surcharges breakdown:`);
          rate.surcharges.forEach((s: any) => {
            const amt = s.amount?.amount || s.amount || 0;
            surchargeTotal += Number(amt);
            console.log(`       - ${s.name || s.description || s.type || 'Unknown'}: $${amt}`);
          });
        }
        console.log(`    💰 Total (base + surcharges): $${(Number(rate.baseCharge?.amount || 0) + surchargeTotal).toFixed(2)}`);
      });
      console.log('='.repeat(80) + '\n');

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
      // UPS and other carriers may require: attention, companyName, phone, email
      // Load default shipment email from settings
      let defaultEmail = 'shipping@goablp.com';
      try {
        const { storage } = await import('../storage');
        const configuredEmail = await storage.getSetting('DEFAULT_SHIPMENT_EMAIL');
        if (configuredEmail) {
          defaultEmail = configuredEmail;
        }
      } catch (e) {
        console.log('Could not load DEFAULT_SHIPMENT_EMAIL from settings, using fallback');
      }
      
      const fromEmail = request.from.email || defaultEmail;
      const toEmail = request.to.email || request.from.email || defaultEmail;
      
      const rateRequest: any = {
        from: {
          attention: request.from.attention || 'GoABLP',
          companyName: request.from.companyName || 'GoABLP',
          streetAddress: request.from.streetAddress || '44322 Yale Rd #3',
          city: request.from.city || 'Chilliwack',
          state: request.from.state || 'BC',
          countryCode: request.from.countryCode,
          postalCode: fromPostalCode,
          phone: formatPhoneNumber(request.from.phone),
          email: fromEmail,
        },
        to: {
          attention: request.to.attention || 'Customer',
          // UPS requires company name - use attention name as fallback for residential
          companyName: request.to.companyName || request.to.attention || 'Residential',
          streetAddress: request.to.streetAddress!,
          city: request.to.city!,
          state: request.to.state!,
          countryCode: request.to.countryCode,
          postalCode: toPostalCode,
          // UPS and some carriers require destination phone - fallback to sender phone if not provided
          phone: formatPhoneNumber(request.to.phone || request.from.phone),
          email: toEmail,
        },
        packageType,
        unitOfMeasurement: 'IMPERIAL',
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
      
      // Build pickupDetail based on official ShipTime API documentation
      // Official structure:
      // {
      //   "location": "FrontDoor",        // Required for scheduled pickups
      //   "otherLocation": "string",      // Optional - description if location is "Other"
      //   "pickupTip": { "currency": "CAD", "amount": 0 },  // Monetary gratuity object
      //   "pickupDate": "2025-12-30",     // YYYY-MM-DD format
      //   "readyTime": "08:00",           // 24-hour HH:MM format
      //   "closeTime": "14:00"            // 24-hour HH:MM format
      // }
      
      // Determine if this is a drop-off or scheduled pickup
      const isDropOff = request.pickupDetails?.pickupOption === 'drop_off' || 
                        request.pickupDetails?.pickupType === 'DROPOFF' ||
                        (!request.pickupDetails?.pickupOption && !request.pickupDetails?.pickupDate);
      
      // For DROP-OFF shipments: omit pickupDetail entirely per ShipTime API contract
      if (!isDropOff) {
        // Valid ShipTime PickupLocationTypeModel enum values (from API error):
        // Receiving, Warehouse, SideDoor, Garage, Kiosk, ShippingRoom, Basement, Other,
        // MailRoom, Pharmacy, Mailbox, BackDoor, Lobby, FrontDoor, Office, ServiceCounter,
        // Reception, PartsDepartment, LoadingDock
        const validLocations: Record<string, string> = {
          'frontdoor': 'FrontDoor',
          'front_door': 'FrontDoor',
          'front door': 'FrontDoor',
          'backdoor': 'BackDoor',
          'back_door': 'BackDoor',
          'back door': 'BackDoor',
          'sidedoor': 'SideDoor',
          'side_door': 'SideDoor',
          'side door': 'SideDoor',
          'office': 'Office',
          'reception': 'Reception',
          'warehouse': 'Warehouse',
          'lobby': 'Lobby',
          'mailroom': 'MailRoom',
          'mail_room': 'MailRoom',
          'mail room': 'MailRoom',
          'garage': 'Garage',
          'basement': 'Basement',
          'kiosk': 'Kiosk',
          'pharmacy': 'Pharmacy',
          'mailbox': 'Mailbox',
          'shippingroom': 'ShippingRoom',
          'shipping_room': 'ShippingRoom',
          'shipping room': 'ShippingRoom',
          'servicecounter': 'ServiceCounter',
          'service_counter': 'ServiceCounter',
          'service counter': 'ServiceCounter',
          'partsdepartment': 'PartsDepartment',
          'parts_department': 'PartsDepartment',
          'parts department': 'PartsDepartment',
          'loadingdock': 'LoadingDock',
          'loading_dock': 'LoadingDock',
          'loading dock': 'LoadingDock',
          'receiving': 'Receiving',
          'other': 'Other',
        };
        
        // Normalize the pickup location to valid ShipTime enum value
        const rawLocation = request.pickupDetails?.pickupLocation || 'FrontDoor';
        const normalizedLocation = validLocations[rawLocation.toLowerCase()] || 
                                   validLocations[rawLocation.toLowerCase().replace(/\s+/g, '')] ||
                                   'FrontDoor'; // Default to FrontDoor if unknown
        
        // For SCHEDULED pickups: build the complete pickupDetail object
        const pickupDetail: any = {
          location: normalizedLocation,
          
          // Pickup tip/gratuity - required as MoneyAmountModel object (not a string!)
          pickupTip: {
            currency: 'CAD',
            amount: 0  // No tip by default
          }
        };
        
        // Add otherLocation description if location is "Other"
        if (pickupDetail.location === 'Other' && request.pickupDetails?.otherLocation) {
          pickupDetail.otherLocation = request.pickupDetails.otherLocation;
        }
        
        // Add pickup date (required for scheduled pickups)
        if (request.pickupDetails?.pickupDate) {
          const pickupDate = new Date(request.pickupDetails.pickupDate);
          pickupDetail.pickupDate = pickupDate.toISOString().split('T')[0];
        } else {
          // Default to today if no date provided for scheduled pickup
          pickupDetail.pickupDate = new Date().toISOString().split('T')[0];
        }
        
        // Format ready time (when package is ready for pickup) - 24-hour format
        if (request.pickupDetails?.readyTime) {
          const { hour, minute, period } = request.pickupDetails.readyTime;
          let hourNum = parseInt(hour);
          if (period === 'PM' && hourNum !== 12) hourNum += 12;
          if (period === 'AM' && hourNum === 12) hourNum = 0;
          pickupDetail.readyTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
        } else {
          pickupDetail.readyTime = '09:00';
        }
        
        // Format close time (last time for pickup) - 24-hour format
        const closeTimeData = request.pickupDetails?.closeTime || request.pickupDetails?.closingTime;
        if (closeTimeData) {
          const { hour, minute, period } = closeTimeData;
          let hourNum = parseInt(hour);
          if (period === 'PM' && hourNum !== 12) hourNum += 12;
          if (period === 'AM' && hourNum === 12) hourNum = 0;
          pickupDetail.closeTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
        } else {
          pickupDetail.closeTime = '17:00';
        }
        
        payload.pickupDetail = pickupDetail;
        console.log('📅 Scheduled pickup - including pickupDetail:', JSON.stringify(pickupDetail, null, 2));
      } else {
        console.log('📦 Drop-off shipment - omitting pickupDetail per ShipTime API contract');
      }

      console.log('\n' + '='.repeat(80));
      console.log('📦 SHIPTIME SHIPMENT CREATION - PRICING TRACE');
      console.log('='.repeat(80));
      console.log('  QuoteId/RateId sent to ShipTime:', request.rateId);
      console.log('  Carrier:', request.carrierName);
      console.log('  Service:', request.serviceName);
      console.log('  CarrierId:', request.carrierId);
      console.log('  ServiceId:', request.serviceId);
      console.log('  Environment:', this.environment);
      console.log('  API URL:', this.getApiUrl());
      console.log('  LineItems (dimensions/weight):');
      lineItems.forEach((item, i) => {
        console.log(`    [${i}] ${item.length}x${item.width}x${item.height} cm, ${item.weight} kg`);
      });
      console.log('  Full payload:', JSON.stringify(payload, null, 2));

      const rawResponse = await this.makeRequest('shipments', 'POST', payload);
      
      console.log('📦 ShipTime raw shipment response:');
      console.log('  Type:', typeof rawResponse);
      console.log('  Keys:', rawResponse ? Object.keys(rawResponse) : 'null/undefined');
      console.log('  Full response:', JSON.stringify(rawResponse, null, 2));
      
      // Handle potential wrapper structures (e.g., { data: {...} } or { shipment: {...} })
      const response = rawResponse?.data || rawResponse?.shipment || rawResponse?.result || rawResponse;
      
      console.log('📦 Unwrapped response:');
      console.log('  Keys:', response ? Object.keys(response) : 'null/undefined');
      console.log('  Response:', JSON.stringify(response, null, 2));
      
      // Extract and log pricing info from ShipTime response for comparison
      console.log('\n💰 SHIPTIME ACTUAL CHARGES (from response):');
      console.log('  baseCharge:', response?.baseCharge || response?.base_charge || 'N/A');
      console.log('  totalCharge:', response?.totalCharge || response?.total_charge || response?.total || 'N/A');
      console.log('  surcharges:', JSON.stringify(response?.surcharges || []));
      console.log('  taxes:', JSON.stringify(response?.taxes || []));
      console.log('  freightCharge:', response?.freightCharge || 'N/A');
      console.log('  fuelSurcharge:', response?.fuelSurcharge || 'N/A');
      console.log('  All pricing keys:', Object.keys(response || {}).filter(k => 
        k.toLowerCase().includes('charge') || 
        k.toLowerCase().includes('cost') || 
        k.toLowerCase().includes('price') ||
        k.toLowerCase().includes('amount') ||
        k.toLowerCase().includes('total') ||
        k.toLowerCase().includes('fee')
      ).join(', ') || 'none found');
      console.log('='.repeat(80) + '\n');
      
      // Auto-cancel sandbox shipments immediately to prevent charges
      const shipmentIdForCancel = response?.shipmentId || response?.id || response?.ShipmentId || response?.ID;
      if (isSandbox && shipmentIdForCancel) {
        console.log(`Auto-cancelling sandbox shipment ${shipmentIdForCancel} to prevent charges`);
        try {
          await this.cancelShipment(shipmentIdForCancel);
          console.log(`Successfully cancelled sandbox shipment ${shipmentIdForCancel}`);
          
          // Add cancellation note to response
          response.autocancelled = true;
          response.cancellationReason = 'Automatic sandbox cancellation to prevent charges';
        } catch (cancelError) {
          console.error(`Failed to auto-cancel sandbox shipment ${response.shipmentId}:`, cancelError);
          // Continue anyway - shipment was created but cancellation failed
        }
      }

      // ShipTime returns 'shipId' (not 'shipmentId'), and 'trackingNumbers' as array
      const shipmentId = response?.shipId || response?.shipmentId || response?.id || response?.ShipmentId || response?.ID || response?.shipment_id;
      // trackingNumbers is an array - take the first one
      const trackingNumber = (Array.isArray(response?.trackingNumbers) ? response.trackingNumbers[0] : response?.trackingNumbers) 
        || response?.trackingNumber || response?.TrackingNumber || response?.tracking?.number || '';
      const labelUrl = response?.labelUrl || response?.LabelUrl || response?.document?.url || response?.labelPdfUrl || response?.label_url || response?.pdfUrl || '';
      
      console.log('📦 Parsed ShipTime response:');
      console.log('  shipmentId:', shipmentId);
      console.log('  trackingNumber:', trackingNumber);
      console.log('  labelUrl:', labelUrl);
      
      if (!shipmentId) {
        throw new Error('Invalid shipment response from ShipTime: missing shipment ID');
      }
      
      // Label URL is required - if missing, the shipment response is incomplete
      if (!labelUrl) {
        console.error('❌ ShipTime response missing label URL');
        console.error('  Full response:', JSON.stringify(response, null, 2));
        throw new Error('Invalid shipment response from ShipTime: missing label URL');
      }

      return {
        id: shipmentId,
        trackingNumber: trackingNumber,
        labelUrl: labelUrl,
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
      await this.makeRequest(`shipments/${shipmentId}`, 'DELETE');
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

  // Get shipment details including label URL
  async getShipmentDetails(shipmentId: string): Promise<{ labelUrl: string | null; trackingNumber: string | null }> {
    try {
      console.log('📋 Fetching ShipTime shipment details for:', shipmentId);
      const response = await this.makeRequest(`shipments/${shipmentId}`, 'GET');
      
      console.log('  Response keys:', Object.keys(response || {}));
      
      // Try multiple possible label URL field names
      const labelUrl = response?.labelUrl || response?.LabelUrl || response?.document?.url || 
                       response?.labelPdfUrl || response?.label_url || response?.pdfUrl ||
                       response?.label?.url || response?.labels?.[0]?.url || null;
      
      const trackingNumber = (Array.isArray(response?.trackingNumbers) ? response.trackingNumbers[0] : response?.trackingNumbers) 
        || response?.trackingNumber || response?.TrackingNumber || null;
      
      console.log('  Found labelUrl:', labelUrl);
      console.log('  Found trackingNumber:', trackingNumber);
      
      return { labelUrl, trackingNumber };
    } catch (error: any) {
      console.error('ShipTime getShipmentDetails error:', error.message);
      throw error;
    }
  }

  // Get label URL directly
  async getLabelUrl(shipmentId: string): Promise<string> {
    // ShipTime label URL is typically: http://restapi.shiptime.com/rest/shipments/{shipmentId}/label
    const apiUrl = this.getApiUrl();
    const labelUrl = `${apiUrl}shipments/${shipmentId}/label`;
    console.log('📄 Generated ShipTime label URL:', labelUrl);
    return labelUrl;
  }
}

export const shiptimeService = new ShipTimeService();
