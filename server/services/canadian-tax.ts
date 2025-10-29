/**
 * Canadian Tax Calculation Service
 * 
 * Provides accurate, destination-based tax calculations for Canadian shipping rates.
 * Uses official 2025 tax rates (GST/HST/QST) based on destination province.
 * 
 * Tax Type by Province:
 * - GST (5%): AB, BC, MB, SK, NT, NU, YT
 * - HST (13%): ON
 * - HST (15%): NB, NL, NS, PE
 * - GST+QST (14.975%): QC (5% GST + 9.975% QST)
 */

export interface CanadianTaxRate {
  province: string;
  rate: number;
  taxType: 'GST' | 'HST' | 'GST+QST';
  description: string;
}

export class CanadianTaxService {
  /**
   * Official 2025 Canadian tax rates by province (destination-based)
   * Source: Canada Revenue Agency (CRA) - Effective rates as of 2025
   */
  private static readonly TAX_RATES: Record<string, CanadianTaxRate> = {
    // 5% GST Provinces
    'AB': { province: 'AB', rate: 0.05, taxType: 'GST', description: 'Alberta - 5% GST' },
    'BC': { province: 'BC', rate: 0.05, taxType: 'GST', description: 'British Columbia - 5% GST' },
    'MB': { province: 'MB', rate: 0.05, taxType: 'GST', description: 'Manitoba - 5% GST' },
    'SK': { province: 'SK', rate: 0.05, taxType: 'GST', description: 'Saskatchewan - 5% GST' },
    'NT': { province: 'NT', rate: 0.05, taxType: 'GST', description: 'Northwest Territories - 5% GST' },
    'NU': { province: 'NU', rate: 0.05, taxType: 'GST', description: 'Nunavut - 5% GST' },
    'YT': { province: 'YT', rate: 0.05, taxType: 'GST', description: 'Yukon - 5% GST' },
    
    // 13% HST Province
    'ON': { province: 'ON', rate: 0.13, taxType: 'HST', description: 'Ontario - 13% HST' },
    
    // 15% HST Provinces
    'NB': { province: 'NB', rate: 0.15, taxType: 'HST', description: 'New Brunswick - 15% HST' },
    'NL': { province: 'NL', rate: 0.15, taxType: 'HST', description: 'Newfoundland and Labrador - 15% HST' },
    'NS': { province: 'NS', rate: 0.15, taxType: 'HST', description: 'Nova Scotia - 15% HST' },
    'PE': { province: 'PE', rate: 0.15, taxType: 'HST', description: 'Prince Edward Island - 15% HST' },
    
    // Quebec - GST + QST
    'QC': { province: 'QC', rate: 0.14975, taxType: 'GST+QST', description: 'Quebec - 5% GST + 9.975% QST' },
  };

  /**
   * Calculate tax amount for a given subtotal and destination province
   * 
   * @param subtotal - The pre-tax amount in dollars
   * @param destinationProvince - Two-letter province code (e.g., 'ON', 'BC', 'QC')
   * @returns Tax amount in dollars
   */
  static calculateTax(subtotal: number, destinationProvince: string): number {
    if (!destinationProvince) {
      console.warn('⚠️ No destination province provided for tax calculation, returning 0% tax');
      return 0;
    }

    const provinceCode = destinationProvince.toUpperCase().trim();
    const taxRate = this.TAX_RATES[provinceCode];

    if (!taxRate) {
      console.warn(`⚠️ Unknown province code: "${provinceCode}" - not a Canadian province, returning 0% tax (prevents incorrect taxation on international shipments)`);
      return 0; // Return 0% for non-Canadian provinces (e.g., U.S. states)
    }

    const taxAmount = subtotal * taxRate.rate;
    
    console.log(`💰 Tax calculation: ${taxRate.description}`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)} × ${(taxRate.rate * 100).toFixed(2)}% = $${taxAmount.toFixed(2)}`);
    
    return taxAmount;
  }

  /**
   * Get tax rate information for a province
   * 
   * @param provinceCode - Two-letter province code
   * @returns Tax rate information or undefined if not found
   */
  static getTaxRate(provinceCode: string): CanadianTaxRate | undefined {
    return this.TAX_RATES[provinceCode.toUpperCase().trim()];
  }

  /**
   * Get tax rate percentage for a province
   * 
   * @param provinceCode - Two-letter province code
   * @returns Tax rate as decimal (e.g., 0.13 for 13%) or 0 if not a Canadian province
   */
  static getTaxRatePercentage(provinceCode: string): number {
    const taxRate = this.getTaxRate(provinceCode);
    if (!taxRate) {
      console.warn(`⚠️ getTaxRatePercentage: Unknown province "${provinceCode}" - returning 0%`);
    }
    return taxRate ? taxRate.rate : 0; // Return 0% for non-Canadian provinces
  }

  /**
   * Validate API-provided tax against official rates
   * Returns true if API tax is within acceptable tolerance (0.5% difference)
   * 
   * @param apiTaxAmount - Tax amount provided by API
   * @param subtotal - Pre-tax subtotal
   * @param destinationProvince - Destination province code
   * @returns Object with validation result and correct tax amount
   */
  static validateApiTax(
    apiTaxAmount: number,
    subtotal: number,
    destinationProvince: string
  ): { isValid: boolean; correctTax: number; apiTax: number; difference: number } {
    const correctTax = this.calculateTax(subtotal, destinationProvince);
    const difference = Math.abs(apiTaxAmount - correctTax);
    const tolerance = subtotal * 0.005; // 0.5% tolerance

    const isValid = difference <= tolerance;

    if (!isValid) {
      console.warn(`⚠️ API tax validation failed for ${destinationProvince}:`);
      console.warn(`   API provided: $${apiTaxAmount.toFixed(2)}`);
      console.warn(`   Correct tax: $${correctTax.toFixed(2)}`);
      console.warn(`   Difference: $${difference.toFixed(2)} (tolerance: $${tolerance.toFixed(2)})`);
    }

    return {
      isValid,
      correctTax,
      apiTax: apiTaxAmount,
      difference
    };
  }

  /**
   * Get all supported provinces
   */
  static getSupportedProvinces(): string[] {
    return Object.keys(this.TAX_RATES);
  }

  /**
   * Get all tax rates for display/debugging
   */
  static getAllTaxRates(): Record<string, CanadianTaxRate> {
    return { ...this.TAX_RATES };
  }
}
