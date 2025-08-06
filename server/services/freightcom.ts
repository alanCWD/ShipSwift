interface FreightcomAddress {
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
  from: FreightcomAddress;
  to: FreightcomAddress;
  packageDetails: PackageDetails;
}

interface ShipmentRequest extends RateRequest {
  rateId: string;
  carrierName: string;
  serviceName: string;
}

interface FreightcomRate {
  rateId: string;
  carrier: { name: string };
  service: { name: string };
  baseCharge: { amount: number };
  surcharges?: Array<{ price: { amount: number } }>;
  taxes?: Array<{ price: { amount: number } }>;
  deliveryDays?: number;
}

interface FreightcomShipment {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  carrier: { name: string };
  service: { name: string };
}

class FreightcomService {
  private apiUrl: string;
  private username: string;
  private password: string;
  private accessToken?: string;

  constructor() {
    // Freightcom uses their live API endpoint
    this.apiUrl = 'https://live.freightcom.com/';
    
    this.username = process.env.FREIGHTCOM_USERNAME || '';
    this.password = process.env.FREIGHTCOM_PASSWORD || '';
    
    if (!this.username || !this.password) {
      console.warn('Freightcom credentials not configured. Some features may not work.');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (!this.username || !this.password) {
      throw new Error('Freightcom credentials not configured');
    }

    try {
      const response = await fetch(`${this.apiUrl}api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Freightcom authentication failed: ${errorText}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('No access token received from Freightcom');
      }

      this.accessToken = data.token as string;
      return this.accessToken;
    } catch (error) {
      console.error('Freightcom authentication error:', error);
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
      throw new Error(`Freightcom API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async getRates(request: RateRequest): Promise<FreightcomRate[]> {
    try {
      const payload = {
        from: {
          countryCode: request.from.countryCode,
          postalCode: request.from.postalCode,
        },
        to: {
          countryCode: request.to.countryCode,
          postalCode: request.to.postalCode,
        },
        packageDetails: {
          length: request.packageDetails.length,
          width: request.packageDetails.width,
          height: request.packageDetails.height,
          weight: request.packageDetails.weight,
        }
      };

      console.log('Freightcom getRates request:', payload);
      const response = await this.makeRequest('api/rates', 'POST', payload);
      
      console.log('Freightcom getRates response:', response);
      return response.rates || [];
    } catch (error) {
      console.error('Freightcom getRates error:', error);
      throw error;
    }
  }

  async createShipment(request: ShipmentRequest): Promise<FreightcomShipment> {
    try {
      const payload = {
        rateId: request.rateId,
        from: {
          countryCode: request.from.countryCode,
          postalCode: request.from.postalCode,
          streetAddress: request.from.streetAddress,
          city: request.from.city,
          state: request.from.state,
          attention: request.from.attention,
          phone: request.from.phone,
        },
        to: {
          countryCode: request.to.countryCode,
          postalCode: request.to.postalCode,
          streetAddress: request.to.streetAddress,
          city: request.to.city,
          state: request.to.state,
          attention: request.to.attention,
          phone: request.to.phone,
        },
        packageDetails: request.packageDetails,
        carrierName: request.carrierName,
        serviceName: request.serviceName,
      };

      console.log('Freightcom createShipment request:', payload);
      const response = await this.makeRequest('api/shipments', 'POST', payload);
      
      console.log('Freightcom createShipment response:', response);
      return response;
    } catch (error) {
      console.error('Freightcom createShipment error:', error);
      throw error;
    }
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      console.log('Freightcom trackShipment request:', trackingNumber);
      const response = await this.makeRequest(`api/tracking/${trackingNumber}`, 'GET');
      
      console.log('Freightcom trackShipment response:', response);
      return response;
    } catch (error) {
      console.error('Freightcom trackShipment error:', error);
      throw error;
    }
  }
}

export const freightcomService = new FreightcomService();