interface StallionAddress {
  name: string;
  street1: string;
  street2?: string;
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
  service_code: string;
  service_name: string;
  carrier_name: string;
  total_price: number;
  currency: string;
  delivery_days?: number;
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
        return [];
      }

      console.log(`✅ Stallion returned ${data.rates.length} rates`);
      console.log('🔍 RAW STALLION API RESPONSE:', JSON.stringify(data, null, 2));
      data.rates.forEach((rate, index) => {
        console.log(`  Rate ${index + 1}: ${rate.carrier_name} - ${rate.service_name}`);
        console.log(`    Price: $${rate.total_price} ${rate.currency}`);
        console.log(`    Delivery: ${rate.delivery_days || 'N/A'} days`);
        console.log(`    Raw rate object:`, JSON.stringify(rate, null, 2));
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
        street1: to.streetAddress || '',
        city: to.city || '',
        province_code: to.state || '',
        postal_code: normalizePostalCode(to.postalCode),
        country_code: to.countryCode || 'CA',
        phone: to.phone,
      },
      return_address: {
        name: from.companyName || from.attention || 'Sender',
        street1: from.streetAddress || '',
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
        description: packageDetails.description || 'General Merchandise',
        quantity: 1,
        value: declaredValue,
        weight: weight,
        origin_country: 'CA',
        currency: 'CAD', // Required by Stallion API
      }],
    };
  }

  // Normalize Stallion rate to standard format (matching ShipTime structure)
  normalizeRate(stallionRate: StallionRate): any {
    // Convert price from dollars to cents for consistency with ShipTime
    const totalInCents = Math.round(stallionRate.total_price * 100);

    return {
      // Flat structure (for backward compatibility)
      carrierName: stallionRate.carrier_name,
      serviceName: stallionRate.service_name,
      
      // Nested structure (matching ShipTime format for frontend compatibility)
      carrier: {
        name: stallionRate.carrier_name,
      },
      service: {
        name: stallionRate.service_name,
      },
      
      baseCharge: {
        amount: totalInCents,
        currency: stallionRate.currency || 'CAD',
      },
      surcharges: [],
      taxes: [],
      
      // Multiple transit time formats for frontend compatibility
      transitDays: stallionRate.delivery_days,
      deliveryDays: stallionRate.delivery_days,
      transitUnit: 'business days',
      transitTime: stallionRate.delivery_days ? `${stallionRate.delivery_days} business days` : undefined,
      
      source: 'stallion',
      rateId: `stallion_${stallionRate.service_code}`,
    };
  }
}

export default new StallionService();
