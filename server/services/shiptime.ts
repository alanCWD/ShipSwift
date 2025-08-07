interface ShipTimeAddress {
  countryCode: string;
  postalCode: string;
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
}

interface RateRequest {
  from: ShipTimeAddress;
  to: ShipTimeAddress;
  packageDetails: PackageDetails;
}

interface ShipmentRequest extends RateRequest {
  rateId: string;
  carrierName: string;
  serviceName: string;
}

interface ShipTimeRate {
  rateId: string;
  carrier: { name: string };
  service: { name: string };
  baseCharge: { amount: number };
  surcharges?: Array<{ price: { amount: number } }>;
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
    this.sandboxApiUrl = 'https://apitest.shiptime.com/rest/';
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
    // First try new environment variables
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
    
    // Then try database settings
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
        return true;
      }
    } catch (error) {
      console.log('Database settings not available, checking environment variables...');
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

  private async makeRequest(endpoint: string, method: string = 'POST', body?: any) {
    // Load credentials from database if not already loaded
    if (!this.username || !this.password) {
      const loaded = await this.loadCredentials();
      if (!loaded) {
        throw new Error('ShipTime credentials not configured in system settings');
      }
    }
    
    const apiUrl = this.getApiUrl();
    console.log(`ShipTime API request to ${this.environment} environment:`, `${apiUrl}${endpoint}`);
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

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
      // Use a simple endpoint that doesn't require complex payload
      // Most APIs have a health check or simple endpoint for testing
      const testResponse = await this.makeRequest('health', 'GET');
      return true;
    } catch (error: any) {
      // If health endpoint doesn't exist, try a minimal rates request
      try {
        const minimalRatesRequest = {
          from: {
            countryCode: 'CA',
            postalCode: 'V2R4H1'
          },
          to: {
            countryCode: 'CA', 
            postalCode: 'V6B1A1'
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
        
        await this.makeRequest('rates', 'POST', minimalRatesRequest);
        return true;
      } catch (testError: any) {
        console.error('ShipTime connection test failed:', testError.message);
        throw testError;
      }
    }
  }

  async getRates(request: RateRequest): Promise<ShipTimeRate[]> {
    try {
      const payload = {
        from: {
          countryCode: request.from.countryCode,
          postalCode: request.from.postalCode,
          ...(request.from.streetAddress && {
            streetAddress: request.from.streetAddress,
            city: request.from.city,
            state: request.from.state,
            attention: request.from.attention,
            phone: request.from.phone,
          })
        },
        to: {
          countryCode: request.to.countryCode,
          postalCode: request.to.postalCode,
          ...(request.to.streetAddress && {
            streetAddress: request.to.streetAddress,
            city: request.to.city,
            state: request.to.state,
            attention: request.to.attention,
            phone: request.to.phone,
          })
        },
        packageType: 'PACKAGE',
        unitOfMeasurement: 'METRIC',
        lineItems: [{
          length: request.packageDetails.length,
          width: request.packageDetails.width,
          height: request.packageDetails.height,
          weight: request.packageDetails.weight,
        }],
        shipDate: new Date().toISOString(),
      };

      const response = await this.makeRequest('rates', 'POST', payload);
      
      if (!response.availableRates || response.availableRates.length === 0) {
        throw new Error('No shipping rates available for this route');
      }

      return response.availableRates;
    } catch (error) {
      console.error('ShipTime getRates error:', error);
      throw error;
    }
  }

  async createShipment(request: ShipmentRequest): Promise<ShipTimeShipment> {
    try {
      const payload = {
        rateId: request.rateId,
        from: {
          attention: request.from.attention || 'ABLP Logistics',
          streetAddress: request.from.streetAddress || '44322 Yale Rd #3',
          city: request.from.city || 'Chilliwack',
          state: request.from.state || 'BC',
          countryCode: request.from.countryCode,
          postalCode: request.from.postalCode,
          phone: request.from.phone || '1-800-225-7564',
        },
        to: {
          attention: request.to.attention || 'Customer',
          streetAddress: request.to.streetAddress!,
          city: request.to.city!,
          state: request.to.state!,
          countryCode: request.to.countryCode,
          postalCode: request.to.postalCode,
          phone: request.to.phone || '',
        },
        packageType: 'PACKAGE',
        unitOfMeasurement: 'METRIC',
        lineItems: [{
          length: request.packageDetails.length,
          width: request.packageDetails.width,
          height: request.packageDetails.height,
          weight: request.packageDetails.weight,
        }],
      };

      const response = await this.makeRequest('shipments', 'POST', payload);
      
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
