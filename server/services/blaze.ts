import { storage } from "../storage";

interface BlazeApiConfig {
  partnerKey: string;
  dispensaryKey: string;
  baseUrl?: string;
}

interface BlazeOrder {
  id: string;
  cartId: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    weight: number;
  }>;
  totalWeight: number;
  orderTotal: number;
  createdAt: string;
}

interface BlazeRateRequest {
  fromPostalCode: string;
  toPostalCode: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  shipmentType: 'package' | 'envelope';
}

class BlazeService {
  private baseUrl: string = 'https://api.partners.blaze.me';

  async getConfig(): Promise<{ partnerKey: string; excludedCarriers: string[]; allowedShipmentTypes: string[] } | null> {
    const settings = await storage.getBlazeSettings();
    if (!settings || !settings.partnerApiKey) {
      return null;
    }
    return {
      partnerKey: settings.partnerApiKey,
      excludedCarriers: settings.excludedCarriers || ['UPS', 'FedEx', 'DHL'],
      allowedShipmentTypes: settings.allowedShipmentTypes || ['package', 'envelope'],
    };
  }

  async testConnection(partnerKey: string, dispensaryKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/partner/store/info`, {
        method: 'GET',
        headers: {
          'partner_key': partnerKey,
          'Authorization': dispensaryKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      } else {
        const errorText = await response.text();
        return { success: false, message: `Connection failed: ${response.status} - ${errorText}` };
      }
    } catch (error: any) {
      return { success: false, message: `Connection error: ${error.message}` };
    }
  }

  async getStoreInfo(config: BlazeApiConfig): Promise<any> {
    try {
      const response = await fetch(`${config.baseUrl || this.baseUrl}/api/v1/partner/store/info`, {
        method: 'GET',
        headers: {
          'partner_key': config.partnerKey,
          'Authorization': config.dispensaryKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get store info: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Blaze getStoreInfo error:', error.message);
      throw error;
    }
  }

  async getActiveCart(config: BlazeApiConfig): Promise<any> {
    try {
      const response = await fetch(`${config.baseUrl || this.baseUrl}/api/v1/partner/store/cart/active`, {
        method: 'GET',
        headers: {
          'partner_key': config.partnerKey,
          'Authorization': config.dispensaryKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get active cart: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Blaze getActiveCart error:', error.message);
      throw error;
    }
  }

  async getCartById(config: BlazeApiConfig, cartId: string): Promise<any> {
    try {
      const response = await fetch(`${config.baseUrl || this.baseUrl}/api/v1/partner/store/cart/${cartId}`, {
        method: 'GET',
        headers: {
          'partner_key': config.partnerKey,
          'Authorization': config.dispensaryKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get cart: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Blaze getCartById error:', error.message);
      throw error;
    }
  }

  async getOrderHistory(config: BlazeApiConfig): Promise<any[]> {
    try {
      const response = await fetch(`${config.baseUrl || this.baseUrl}/api/v1/partner/store/cart/history`, {
        method: 'GET',
        headers: {
          'partner_key': config.partnerKey,
          'Authorization': config.dispensaryKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get order history: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error: any) {
      console.error('Blaze getOrderHistory error:', error.message);
      throw error;
    }
  }

  filterRatesByCarrier(rates: any[], excludedCarriers: string[]): any[] {
    if (!excludedCarriers || excludedCarriers.length === 0) {
      return rates;
    }

    return rates.filter(rate => {
      const carrierName = rate.carrierName || rate.carrier || '';
      const normalizedCarrier = carrierName.toUpperCase();
      
      for (const excluded of excludedCarriers) {
        if (normalizedCarrier.includes(excluded.toUpperCase())) {
          console.log(`🚫 Filtering out carrier: ${carrierName} (matches excluded: ${excluded})`);
          return false;
        }
      }
      return true;
    });
  }

  async getShippingRates(
    request: BlazeRateRequest,
    excludedCarriers: string[]
  ): Promise<any[]> {
    const rateAggregator = (await import('./rate-aggregator')).default;
    
    const rateRequest = {
      from: {
        countryCode: 'CA',
        postalCode: request.fromPostalCode,
      },
      to: {
        countryCode: 'CA',
        postalCode: request.toPostalCode,
      },
      packageDetails: {
        weight: request.weight,
        length: request.length || 10,
        width: request.width || 10,
        height: request.height || 10,
      },
      shipmentType: request.shipmentType,
    };

    const rates = await rateAggregator.getRates(rateRequest, storage);
    
    const filteredRates = this.filterRatesByCarrier(rates, excludedCarriers);
    
    console.log(`📦 Blaze rates: ${rates.length} total, ${filteredRates.length} after carrier filtering`);
    
    return filteredRates;
  }
}

export const blazeService = new BlazeService();
export default blazeService;
