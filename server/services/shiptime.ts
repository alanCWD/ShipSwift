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
  private username: string;
  private password: string;
  private accessToken?: string;

  constructor() {
    // Always use production environment as requested
    this.apiUrl = 'https://restapi.shiptime.com/rest/';
    
    // Use SHIPTIME_EMAIL for username to avoid confusion with swapped values
    this.username = process.env.SHIPTIME_EMAIL || process.env.SHIPTIME_USERNAME || '';
    this.password = process.env.SHIPTIME_PASSWORD || '';
    
    // Clear any cached token when credentials change
    this.accessToken = undefined;
    
    console.log('ShipTimeService initialized with username:', this.username);
    
    if (!this.username || !this.password) {
      console.warn('ShipTime credentials not configured. Some features may not work.');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (!this.username || !this.password) {
      throw new Error('ShipTime credentials not configured');
    }

    try {
      console.log('ShipTime authentication attempt with username:', this.username);
      const response = await fetch(`${this.apiUrl}token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ShipTime authentication failed: ${errorText}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('No access token received from ShipTime');
      }

      this.accessToken = data.token as string;
      return this.accessToken;
    } catch (error) {
      console.error('ShipTime authentication error:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, method: string = 'POST', body?: any) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ShipTime API error (${response.status}): ${errorText}`);
    }

    return await response.json();
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
