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

    // Calculate base charge only (excluding surcharges and taxes)
    // Ensure baseChargeAmount is a number (convert strings to numbers)
    const baseChargeAmount = Number(rate.baseCharge?.amount || 0);
    const baseChargeInDollars = baseChargeAmount / 100; // Convert from cents
    
    // DEBUG: Log the raw rate data from ShipTime
    console.log(`\n🔍 Processing rate for ${carrierName} - ${serviceName}`);
    console.log('  Raw ShipTime data:');
    console.log('    baseCharge.amount (cents):', rate.baseCharge?.amount);
    console.log('    baseCharge in dollars:', baseChargeInDollars);
    if (rate.surcharges && rate.surcharges.length > 0) {
      console.log('    Surcharges:');
      rate.surcharges.forEach(s => {
        console.log(`      - ${s.name}: ${s.price?.amount} cents = $${(Number(s.price?.amount || 0) / 100).toFixed(2)}`);
      });
    }
    if (rate.taxes && rate.taxes.length > 0) {
      console.log('    Taxes:');
      rate.taxes.forEach(t => {
        console.log(`      - ${(t as any).name || 'Tax'}: ${t.price?.amount} cents = $${(Number(t.price?.amount || 0) / 100).toFixed(2)}`);
      });
    }
    
    // Calculate surcharges separately
    // Ensure each surcharge amount is a number
    const surchargesAmount = (rate.surcharges || []).reduce(
      (sum, s) => sum + Number(s.price?.amount || 0), 
      0
    );
    const surchargesInDollars = surchargesAmount / 100; // Convert from cents

    // Calculate tax amount separately
    // Ensure each tax amount is a number
    const taxAmount = (rate.taxes || []).reduce(
      (sum, tax) => sum + Number(tax.price?.amount || 0), 
      0
    ) / 100;

    // Apply markup to BASE CHARGE ONLY (not surcharges or taxes)
    let markup = 0;
    let markupType = 'default';

    if (matchingRule) {
      markupType = matchingRule.markupType;
      const markupValue = parseFloat(matchingRule.markupValue);

      if (matchingRule.markupType === 'percentage') {
        markup = baseChargeInDollars * (markupValue / 100);
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
      // Apply default markup percentage to base charge only
      markup = baseChargeInDollars * (this.defaultMarkupPercentage / 100);
      markupType = `default_${this.defaultMarkupPercentage}%`;
    }

    // Calculate subtotal: (base + markup) + surcharges (excluding taxes)
    const baseWithMarkup = baseChargeInDollars + markup;
    const subtotal = baseWithMarkup + surchargesInDollars;
    
    // DEBUG: Log markup calculation results
    console.log('  Markup calculation:');
    console.log('    markup percentage:', this.defaultMarkupPercentage + '%');
    console.log('    markup amount:', `$${markup.toFixed(2)}`);
    console.log('    base + markup:', `$${baseWithMarkup.toFixed(2)}`);
    console.log('    surcharges total:', `$${surchargesInDollars.toFixed(2)}`);
    console.log('    subtotal (before tax):', `$${subtotal.toFixed(2)}`);
    console.log('    tax amount:', `$${taxAmount.toFixed(2)}`);
    console.log('    total (with tax):', `$${(subtotal + taxAmount).toFixed(2)}`);
    
    // Safety check: If any calculation resulted in NaN, log error and use fallback
    if (isNaN(subtotal) || isNaN(taxAmount)) {
      console.error('⚠️ Rate calculation produced NaN:', {
        carrier: carrierName,
        service: serviceName,
        baseChargeAmount,
        baseChargeInDollars,
        surchargesAmount,
        surchargesInDollars,
        taxAmount,
        markup,
        subtotal,
        rawRate: JSON.stringify(rate, null, 2)
      });
      
      // Fallback to safe values
      const fallbackSubtotal = isNaN(subtotal) ? 0 : subtotal;
      const fallbackTaxAmount = isNaN(taxAmount) ? 0 : taxAmount;
      
      return {
        ...rate,
        originalBaseCharge: isNaN(baseChargeInDollars) ? 0 : baseChargeInDollars,
        markup: isNaN(markup) ? 0 : markup,
        markupType,
        taxAmount: fallbackTaxAmount,
        subtotal: fallbackSubtotal,
        baseCharge: {
          ...rate.baseCharge,
          amount: Math.round(fallbackSubtotal * 100)
        }
      };
    }

    return {
      ...rate,
      originalBaseCharge: baseChargeInDollars,
      markup,
      markupType,
      taxAmount,
      subtotal, // This is (base + markup + surcharges), before tax
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
