interface StallionAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  province_code: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  email?: string;
}

interface StallionParcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  description?: string;
}

interface StallionRateRequest {
  to_address: StallionAddress;
  return_address?: StallionAddress;
  weight_unit: 'kg' | 'lb';
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  size_unit: 'cm' | 'in';
  package_type: string;
  items?: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_code?: string;
    origin_country?: string;
    currency?: string;
  }>;
}

interface StallionRate {
  postage_type_id: number;
  postage_type: string;
  trackable: boolean;
  package_type: string;
  base_rate: number;
  add_ons?: Array<{
    name: string;
    type: string;
    cost: number;
    currency: string;
  }>;
  rate: number;
  gst: number;
  pst: number;
  hst: number;
  qst: number;
  tax: number;
  duty: number;
  duty_tax: number;
  total: number;
  currency: string;
  delivery_days?: string;
  delivery_date?: string;
}

interface StallionRateResponse {
  rates: StallionRate[];
}

export class StallionService {
  private apiUrl: string;
  private sandboxApiUrl: string;
  private apiToken?: string;
  private environment: 'production' | 'sandbox';

  constructor() {
    this.apiUrl = 'https://ship.stallionexpress.ca/api/v4/';
    this.sandboxApiUrl = 'https://sandbox.stallionexpress.ca/api/v4/';
    this.environment = 'production';
    console.log('StallionService initialized');
  }

  // Load credentials from database
  async loadCredentials(storage: any): Promise<void> {
    try {
      const apiToken = await storage.getSystemSetting('stallion_api_token');
      const environment = await storage.getSystemSetting('stallion_environment');

      if (apiToken) {
        this.apiToken = apiToken;
        console.log('Stallion API token loaded from database');
      } else {
        console.log('⚠️  Stallion API token not configured - skipping Stallion rates');
        throw new Error('Stallion API credentials not configured');
      }

      if (environment) {
        this.environment = environment as 'production' | 'sandbox';
      }
    } catch (error) {
      console.error('Failed to load Stallion credentials:', error);
      throw new Error('Stallion API credentials not configured');
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiToken) {
        throw new Error('Stallion API token not configured');
      }

      const baseUrl = this.environment === 'sandbox' ? this.sandboxApiUrl : this.apiUrl;
      
      // Test with a simple endpoint - getting locations
      const response = await fetch(`${baseUrl}locations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Stallion API test failed (${response.status}):`, errorText);
        throw new Error(`Stallion API authentication failed: ${response.status}`);
      }

      console.log('Stallion API connection test successful');
      return true;
    } catch (error: any) {
      console.error('Stallion connection test failed:', error.message);
      throw error;
    }
  }

  // Get shipping rates
  async getRates(request: StallionRateRequest): Promise<StallionRate[]> {
    try {
      if (!this.apiToken) {
        throw new Error('Stallion API token not configured');
      }

      const baseUrl = this.environment === 'sandbox' ? this.sandboxApiUrl : this.apiUrl;
      
      console.log('🚀 Requesting rates from Stallion API...');
      console.log('Fetching rates with payload:', JSON.stringify(request, null, 2));

      const response = await fetch(`${baseUrl}rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Stallion API error (${response.status}):`, responseText);
        throw new Error(`Stallion API error (${response.status}): ${responseText}`);
      }

      let data: StallionRateResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Stallion API response:', responseText);
        throw new Error('Invalid JSON response from Stallion API');
      }

      if (!data.rates || data.rates.length === 0) {
        console.log('⚠️ Stallion returned no rates');
        console.log('Full Stallion API response:', JSON.stringify(data, null, 2));
        return [];
      }

      console.log(`✅ Stallion returned ${data.rates.length} rates`);
      data.rates.forEach((rate, index) => {
        console.log(`  Rate ${index + 1}: ${rate.postage_type}`);
        console.log(`    Base Rate: $${rate.base_rate} ${rate.currency}`);
        console.log(`    Total: $${rate.total} ${rate.currency}`);
        console.log(`    Delivery: ${rate.delivery_days || 'N/A'}`);
      });

      return data.rates;
    } catch (error) {
      console.error('Stallion getRates error:', error);
      throw error;
    }
  }

  // Convert standard rate request to Stallion format
  convertToStallionRequest(from: any, to: any, packageDetails: any): StallionRateRequest {
    // Normalize postal codes - Stallion may accept spaces but we'll normalize
    const normalizePostalCode = (code: string) => {
      return code?.replace(/\s+/g, '').toUpperCase() || '';
    };

    // Calculate total weight and default value
    const weight = packageDetails.weight || 1;
    // Default $50/kg, capped at Stallion's max of $1000
    const calculatedValue = weight * 50;
    const declaredValue = packageDetails.declaredValue || Math.min(calculatedValue, 1000);

    return {
      to_address: {
        name: to.companyName || to.attention || 'Recipient',
        address1: to.streetAddress || '',
        city: to.city || '',
        province_code: to.state || '',
        postal_code: normalizePostalCode(to.postalCode),
        country_code: to.countryCode || 'CA',
        phone: to.phone,
      },
      return_address: {
        name: from.companyName || from.attention || 'Sender',
        address1: from.streetAddress || '',
        city: from.city || '',
        province_code: from.state || '',
        postal_code: normalizePostalCode(from.postalCode),
        country_code: from.countryCode || 'CA',
        phone: from.phone,
      },
      weight_unit: 'kg', // Metric units (matching our standard)
      weight: weight,
      length: packageDetails.length || 10,
      width: packageDetails.width || 10,
      height: packageDetails.height || 10,
      size_unit: 'cm', // Metric units (matching our standard)
      package_type: 'Parcel', // Standard package type for Stallion
      items: [{
        description: packageDetails.description || 'Package',
        quantity: 1,
        value: declaredValue,
        weight: weight,
        origin_country: 'CA',
        currency: 'CAD', // Required by Stallion API
      }],
    };
  }

  // Create a shipment with Stallion Express
  async createShipment(request: {
    rateId: string;
    postageTypeId: number;
    from: any;
    to: any;
    packageDetails: any;
    referenceNumber?: string;
  }): Promise<{
    id: string;
    trackingNumber: string;
    labelUrl: string;
    carrier: { name: string };
    service: { name: string };
  }> {
    try {
      if (!this.apiToken) {
        throw new Error('Stallion API token not configured');
      }

      const baseUrl = this.environment === 'sandbox' ? this.sandboxApiUrl : this.apiUrl;
      
      // Normalize postal codes
      const normalizePostalCode = (code: string) => {
        return code?.replace(/\s+/g, '').toUpperCase() || '';
      };

      // Calculate declared value
      const weight = request.packageDetails.weight || 1;
      const calculatedValue = weight * 50;
      const declaredValue = request.packageDetails.declaredValue || Math.min(calculatedValue, 1000);

      // Build shipment request payload
      const shipmentPayload = {
        postage_type_id: request.postageTypeId,
        to_address: {
          name: request.to.attention || request.to.companyName || 'Recipient',
          address1: request.to.streetAddress || '',
          address2: request.to.streetAddress2 || '',
          city: request.to.city || '',
          province_code: request.to.state || '',
          postal_code: normalizePostalCode(request.to.postalCode),
          country_code: request.to.countryCode || 'CA',
          phone: request.to.phone || '',
          email: request.to.email || '',
        },
        return_address: {
          name: request.from.attention || request.from.companyName || 'Sender',
          address1: request.from.streetAddress || '',
          address2: request.from.streetAddress2 || '',
          city: request.from.city || '',
          province_code: request.from.state || '',
          postal_code: normalizePostalCode(request.from.postalCode),
          country_code: request.from.countryCode || 'CA',
          phone: request.from.phone || '',
          email: request.from.email || '',
        },
        weight_unit: 'kg',
        weight: weight,
        length: request.packageDetails.length || 10,
        width: request.packageDetails.width || 10,
        height: request.packageDetails.height || 10,
        size_unit: 'cm',
        package_type: 'Parcel',
        reference: request.referenceNumber || '',
        items: [{
          description: request.packageDetails.description || 'Package',
          quantity: 1,
          value: declaredValue,
          weight: weight,
          origin_country: 'CA',
          currency: 'CAD',
        }],
      };

      console.log('🚀 Creating Stallion shipment...');
      console.log('  Postage Type ID:', request.postageTypeId);
      console.log('  From:', shipmentPayload.return_address.postal_code);
      console.log('  To:', shipmentPayload.to_address.postal_code);
      console.log('  Weight:', weight, 'kg');

      const response = await fetch(`${baseUrl}shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentPayload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Stallion API error (${response.status}):`, responseText);
        throw new Error(`Stallion API error (${response.status}): ${responseText}`);
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Stallion API response:', responseText);
        throw new Error('Invalid JSON response from Stallion API');
      }

      if (!data.success) {
        const errorMessage = data.errors?.join(', ') || data.message || 'Unknown error';
        console.error('Stallion shipment creation failed:', errorMessage);
        throw new Error(`Stallion shipment creation failed: ${errorMessage}`);
      }

      const shipment = data.shipment;
      
      console.log('✅ Stallion shipment created successfully');
      console.log('  Ship Code:', shipment.ship_code);
      console.log('  Tracking Number:', shipment.tracking_number);
      console.log('  Label URL:', shipment.label_url);

      return {
        id: shipment.ship_code || shipment.id,
        trackingNumber: shipment.tracking_number || shipment.ship_code,
        labelUrl: shipment.label_url || shipment.label,
        carrier: {
          name: shipment.carrier_name || 'Stallion Express',
        },
        service: {
          name: shipment.postage_type || 'Standard',
        },
      };
    } catch (error) {
      console.error('Stallion createShipment error:', error);
      throw error;
    }
  }

  // Normalize Stallion rate to standard format (matching ShipTime structure)
  normalizeRate(stallionRate: StallionRate): any {
    // Parse carrier name from postage_type (e.g., "Intelcom", "UPS Standard")
    // For services like "UPS Standard", extract carrier and service separately
    const postageType = stallionRate.postage_type || 'Unknown';
    let carrierName = postageType;
    let serviceName = postageType;
    
    // Known carrier prefixes
    const carriers = ['UPS', 'Purolator', 'FedEx', 'ICS', 'Intelcom', 'Canada Post'];
    for (const carrier of carriers) {
      if (postageType.startsWith(carrier)) {
        carrierName = carrier;
        serviceName = postageType.substring(carrier.length).trim() || carrier;
        break;
      }
    }
    
    // Convert base rate from dollars to cents for consistency with ShipTime
    const baseRateInCents = Math.round(stallionRate.base_rate * 100);
    
    // Convert add-ons to surcharges format
    const surcharges = (stallionRate.add_ons || []).map(addon => ({
      name: addon.name,
      price: {
        amount: Math.round(addon.cost * 100),
        currency: addon.currency,
      }
    }));

    // Parse delivery days and provide BOTH string and numeric formats
    // - transitTime: String with range for UI display (e.g., "2-3 business days")
    // - deliveryDays: Numeric midpoint for API compatibility and sorting (e.g., 3)
    let transitTimeDisplay: string;
    let deliveryDaysNumeric: number | undefined;
    
    if (stallionRate.delivery_days && typeof stallionRate.delivery_days === 'string') {
      const deliveryDaysStr = stallionRate.delivery_days.trim();
      
      if (deliveryDaysStr.includes('-')) {
        // Range format: preserve range for display, calculate midpoint for sorting/API
        transitTimeDisplay = `${deliveryDaysStr} business days`;
        
        const [min, max] = deliveryDaysStr.split('-').map(d => parseInt(d.trim()));
        deliveryDaysNumeric = Math.round((min + max) / 2);
      } else {
        // Single value: use as-is for both display and numeric
        const days = parseInt(deliveryDaysStr);
        transitTimeDisplay = `${days} business days`;
        deliveryDaysNumeric = days;
      }
    } else if (typeof stallionRate.delivery_days === 'number') {
      // Numeric format: use directly
      transitTimeDisplay = `${stallionRate.delivery_days} business days`;
      deliveryDaysNumeric = stallionRate.delivery_days;
    } else {
      // No delivery days provided
      transitTimeDisplay = 'N/A';
      deliveryDaysNumeric = undefined;
    }

    return {
      // Flat structure (for backward compatibility)
      carrierName: carrierName,
      serviceName: serviceName,
      
      // Nested structure (matching ShipTime format for frontend compatibility)
      carrier: {
        name: carrierName,
      },
      service: {
        name: serviceName,
      },
      
      baseCharge: {
        amount: baseRateInCents,
        currency: stallionRate.currency || 'CAD',
      },
      surcharges: surcharges,
      taxes: [], // Taxes will be recalculated by our tax service
      
      // Transit time fields (dual format for different use cases):
      // - transitTime: String with range for accurate UI display (e.g., "2-3 business days")
      // - deliveryDays: Numeric midpoint for merchant API, sorting, and SLA calculations
      transitTime: transitTimeDisplay,
      deliveryDays: deliveryDaysNumeric,
      transitUnit: 'business days',
      
      source: 'stallion',
      rateId: `stallion_${stallionRate.postage_type_id}`,
    };
  }
}

export default new StallionService();
