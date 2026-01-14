import { storage } from '../storage';
import { CanadianTaxService } from './canadian-tax';

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
  quoteId?: string;
  carrierId?: string;
  serviceId?: string;
  id?: string;
  carrier: { name: string; id?: string };
  service: { name: string; id?: string };
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
   * @param rates - Array of rates to apply markup to
   * @param destinationProvince - Two-letter destination province code for accurate tax calculation
   */
  async applyMarkups(rates: ShipTimeRate[], destinationProvince?: string): Promise<MarkedUpRate[]> {
    // Get all active markup rules from database
    const markupRules = await this.getMarkupRules();

    return rates.map(rate => this.applyMarkupToRate(rate, markupRules, destinationProvince));
  }

  /**
   * Apply markup to a single rate
   */
  private applyMarkupToRate(rate: ShipTimeRate, rules: RateMarkupRule[], destinationProvince?: string): MarkedUpRate {
    // Check both nested and flat structures for carrier/service names
    const carrierName = rate.carrier?.name || (rate as any).carrierName || 'Unknown';
    const serviceName = rate.service?.name || (rate as any).serviceName || 'Unknown';
    
    // Preserve ShipTime identifiers for shipment creation
    const quoteId = rate.quoteId || (rate as any).id;
    const carrierId = rate.carrierId || rate.carrier?.id;
    const serviceId = rate.serviceId || rate.service?.id;
    
    console.log(`  IDs: quoteId=${quoteId}, carrierId=${carrierId}, serviceId=${serviceId}`);

    // Find matching markup rule (most specific first)
    const matchingRule = this.findMatchingRule(carrierName, serviceName, rules);

    // Calculate base charge (excluding surcharges and taxes)
    // Ensure baseChargeAmount is a number (convert strings to numbers)
    const baseChargeAmount = Number(rate.baseCharge?.amount || 0);
    const baseChargeInDollars = baseChargeAmount / 100; // Convert from cents
    
    // Calculate surcharges separately
    // Ensure each surcharge amount is a number
    const surchargesAmount = (rate.surcharges || []).reduce(
      (sum, s) => sum + Number(s.price?.amount || 0), 
      0
    );
    const surchargesInDollars = surchargesAmount / 100; // Convert from cents
    
    // TOTAL CARRIER COST = base + surcharges (what carrier actually bills us)
    const totalCarrierCost = baseChargeInDollars + surchargesInDollars;
    
    // DEBUG: Log the raw rate data from API
    console.log(`\n🔍 Processing rate for ${carrierName} - ${serviceName}`);
    console.log('  Raw API data:');
    console.log('    baseCharge.amount (cents):', rate.baseCharge?.amount);
    console.log('    baseCharge in dollars:', baseChargeInDollars);
    if (rate.surcharges && rate.surcharges.length > 0) {
      console.log('    Surcharges:');
      rate.surcharges.forEach(s => {
        console.log(`      - ${s.name}: ${s.price?.amount} cents = $${(Number(s.price?.amount || 0) / 100).toFixed(2)}`);
      });
    }
    console.log('    Total carrier cost (base + surcharges):', totalCarrierCost.toFixed(2));
    
    // Log API-provided taxes (for comparison/validation)
    const apiTaxAmount = (rate.taxes || []).reduce(
      (sum, tax) => sum + Number(tax.price?.amount || 0), 
      0
    ) / 100;
    if (rate.taxes && rate.taxes.length > 0) {
      console.log('    API-provided taxes:');
      rate.taxes.forEach(t => {
        console.log(`      - ${(t as any).name || 'Tax'}: ${t.price?.amount} cents = $${(Number(t.price?.amount || 0) / 100).toFixed(2)}`);
      });
      console.log(`    Total API tax: $${apiTaxAmount.toFixed(2)}`);
    }

    // Apply markup to TOTAL CARRIER COST (base + surcharges)
    // This ensures we make the full markup percentage on everything we pay to the carrier
    let markup = 0;
    let markupType = 'default';

    if (matchingRule) {
      markupType = matchingRule.markupType;
      const markupValue = parseFloat(matchingRule.markupValue);

      if (matchingRule.markupType === 'percentage') {
        // Apply markup to total carrier cost (base + surcharges)
        markup = totalCarrierCost * (markupValue / 100);
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
      // Apply default markup percentage to total carrier cost
      markup = totalCarrierCost * (this.defaultMarkupPercentage / 100);
      markupType = `default_${this.defaultMarkupPercentage}%`;
    }

    // Calculate subtotal: total carrier cost + markup (excluding taxes)
    const subtotal = totalCarrierCost + markup;
    
    // Calculate accurate Canadian tax using official rates
    // This OVERRIDES API-provided taxes to ensure 100% accuracy
    const taxAmount = destinationProvince 
      ? CanadianTaxService.calculateTax(subtotal, destinationProvince)
      : apiTaxAmount; // Fallback to API tax if no province provided
    
    // Validate API tax against our calculated tax
    if (destinationProvince && apiTaxAmount > 0) {
      const validation = CanadianTaxService.validateApiTax(apiTaxAmount, subtotal, destinationProvince);
      if (!validation.isValid) {
        console.log(`   ⚠️  Using corrected tax: $${validation.correctTax.toFixed(2)} (API had $${validation.apiTax.toFixed(2)})`);
      }
    }
    
    // DEBUG: Log markup calculation results
    console.log('  Markup calculation:');
    console.log('    carrier cost (base + surcharges):', `$${totalCarrierCost.toFixed(2)}`);
    console.log('    markup percentage:', this.defaultMarkupPercentage + '%');
    console.log('    markup amount:', `$${markup.toFixed(2)}`);
    console.log('    subtotal (carrier + markup, before tax):', `$${subtotal.toFixed(2)}`);
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
        quoteId,
        carrierId,
        serviceId,
        originalBaseCharge: isNaN(totalCarrierCost) ? 0 : totalCarrierCost, // Total carrier cost (base + surcharges)
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
      quoteId,
      carrierId,
      serviceId,
      originalBaseCharge: totalCarrierCost, // Total carrier cost (base + surcharges) - what we pay carrier
      markup,
      markupType,
      taxAmount,
      subtotal, // This is carrier cost + markup, before tax
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
