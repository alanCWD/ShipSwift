import { storage } from '../storage';

interface RateMarkupRule {
  id: string;
  carrierName: string | null;
  serviceName: string | null;
  markupType: string;
  markupValue: string;
  minMarkup: string | null;
  maxMarkup: string | null;
}

interface ShipTimeRate {
  rateId: string;
  carrier: { name: string };
  service: { name: string };
  baseCharge: { amount: number };
  surcharges?: Array<{ name?: string; price: { amount: number } }>;
  taxes?: Array<{ price: { amount: number } }>;
  deliveryDays?: number;
}

interface MarkedUpRate extends ShipTimeRate {
  originalBaseCharge: number;
  markup: number;
  markupType: string;
  taxAmount: number;
  subtotal: number;
}

export class RateMarkupService {
  private defaultMarkupPercentage = 15; // 15% default markup

  /**
   * Apply markup rules to shipping rates
   */
  async applyMarkups(rates: ShipTimeRate[]): Promise<MarkedUpRate[]> {
    // Get all active markup rules from database
    const markupRules = await this.getMarkupRules();

    return rates.map(rate => this.applyMarkupToRate(rate, markupRules));
  }

  /**
   * Apply markup to a single rate
   */
  private applyMarkupToRate(rate: ShipTimeRate, rules: RateMarkupRule[]): MarkedUpRate {
    const carrierName = rate.carrier?.name || 'Unknown';
    const serviceName = rate.service?.name || 'Unknown';

    // Find matching markup rule (most specific first)
    const matchingRule = this.findMatchingRule(carrierName, serviceName, rules);

    // Calculate base charge (excluding taxes)
    const baseChargeAmount = rate.baseCharge?.amount || 0;
    const surchargesAmount = (rate.surcharges || []).reduce(
      (sum, s) => sum + (s.price?.amount || 0), 
      0
    );
    const baseTotal = (baseChargeAmount + surchargesAmount) / 100; // Convert from cents

    // Calculate tax amount separately
    const taxAmount = (rate.taxes || []).reduce(
      (sum, tax) => sum + (tax.price?.amount || 0), 
      0
    ) / 100;

    // Apply markup to base total only (not taxes)
    let markup = 0;
    let markupType = 'default';

    if (matchingRule) {
      markupType = matchingRule.markupType;
      const markupValue = parseFloat(matchingRule.markupValue);

      if (matchingRule.markupType === 'percentage') {
        markup = baseTotal * (markupValue / 100);
      } else {
        markup = markupValue;
      }

      // Apply min/max limits if specified
      if (matchingRule.minMarkup) {
        const minMarkup = parseFloat(matchingRule.minMarkup);
        markup = Math.max(markup, minMarkup);
      }
      if (matchingRule.maxMarkup) {
        const maxMarkup = parseFloat(matchingRule.maxMarkup);
        markup = Math.min(markup, maxMarkup);
      }
    } else {
      // Apply default markup percentage
      markup = baseTotal * (this.defaultMarkupPercentage / 100);
      markupType = `default_${this.defaultMarkupPercentage}%`;
    }

    // Calculate subtotal (base + markup, excluding taxes)
    const subtotal = baseTotal + markup;

    return {
      ...rate,
      originalBaseCharge: baseTotal,
      markup,
      markupType,
      taxAmount,
      subtotal, // This is what should be compared with ShipTime (pre-tax)
      baseCharge: {
        ...rate.baseCharge,
        amount: Math.round(subtotal * 100) // Update baseCharge to include markup
      }
    };
  }

  /**
   * Find the most specific matching markup rule
   * Priority: carrier + service > carrier only > default
   */
  private findMatchingRule(
    carrierName: string, 
    serviceName: string, 
    rules: RateMarkupRule[]
  ): RateMarkupRule | null {
    // Try exact match (carrier + service)
    let match = rules.find(
      r => r.carrierName === carrierName && r.serviceName === serviceName
    );
    if (match) return match;

    // Try carrier match (any service)
    match = rules.find(
      r => r.carrierName === carrierName && !r.serviceName
    );
    if (match) return match;

    // No match found
    return null;
  }

  /**
   * Get all active markup rules from database
   */
  private async getMarkupRules(): Promise<RateMarkupRule[]> {
    try {
      const rules = await storage.getRateMarkups();
      return rules as RateMarkupRule[];
    } catch (error) {
      console.error('Error fetching markup rules:', error);
      return [];
    }
  }

  /**
   * Calculate total with taxes (for final payment)
   */
  calculateTotalWithTaxes(rate: MarkedUpRate): number {
    return rate.subtotal + rate.taxAmount;
  }
}

export const rateMarkupService = new RateMarkupService();
