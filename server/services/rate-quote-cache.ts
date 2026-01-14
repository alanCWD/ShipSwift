interface CachedQuote {
  quoteId: string;
  carrierName: string;
  serviceName: string;
  carrierNetAmount: number;
  markupAmount: number;
  markupPercentage: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date; // When this quote was consumed to create a shipment
  usedForShipmentId?: string; // The shipment ID created with this quote
  rateBreakdown?: {
    baseCharge: { amount: number };
    surcharges: Array<{ name: string; amount: number }>;
  };
}

class RateQuoteCacheService {
  private cache: Map<string, CachedQuote> = new Map();
  private readonly QUOTE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  cacheQuote(rate: any): void {
    const quoteId = rate.quoteId || rate.rateId || rate.id;
    if (!quoteId) {
      console.log('⚠️ Cannot cache rate - no quoteId');
      console.log('   Rate keys:', Object.keys(rate).join(', '));
      return;
    }

    const carrierName = rate.carrier?.name || rate.carrierName || 'Unknown';
    const serviceName = rate.service?.name || rate.serviceName || 'Unknown';
    const carrierNetAmount = Number(rate.originalBaseCharge || 0);
    const markupAmount = Number(rate.markup || 0);
    const markupPercentage = carrierNetAmount > 0 ? (markupAmount / carrierNetAmount) * 100 : 15;
    const subtotal = Number(rate.subtotal || 0);
    const taxAmount = Number(rate.taxAmount || 0);
    const total = subtotal + taxAmount;

    const now = new Date();
    // Extract rateBreakdown from original rate for storage
    const rateBreakdown = rate.baseCharge ? {
      baseCharge: { amount: Number(rate.baseCharge?.amount || 0) },
      surcharges: Array.isArray(rate.surcharges) 
        ? rate.surcharges.map((s: any) => ({ name: s.name || 'Surcharge', amount: Number(s.amount || 0) }))
        : []
    } : undefined;

    const cached: CachedQuote = {
      quoteId,
      carrierName,
      serviceName,
      carrierNetAmount,
      markupAmount,
      markupPercentage,
      subtotal,
      taxAmount,
      total,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.QUOTE_TTL_MS),
      rateBreakdown,
    };

    this.cache.set(quoteId, cached);
    
    // Detailed logging for rate tracing
    console.log(`\n💾 CACHED RATE QUOTE [${quoteId}]`);
    console.log(`   ├── Carrier: ${carrierName}`);
    console.log(`   ├── Service: ${serviceName}`);
    console.log(`   ├── Carrier Net (API price): $${carrierNetAmount.toFixed(2)}`);
    console.log(`   ├── Markup Amount: $${markupAmount.toFixed(2)} (${markupPercentage.toFixed(1)}%)`);
    console.log(`   ├── Subtotal (with markup): $${subtotal.toFixed(2)}`);
    console.log(`   ├── Tax Amount: $${taxAmount.toFixed(2)}`);
    console.log(`   ├── TOTAL (customer pays): $${total.toFixed(2)}`);
    console.log(`   └── Expires: ${cached.expiresAt.toISOString()}`);
    
    // Log source rate fields for debugging
    console.log(`   [Debug] Source rate fields:`);
    console.log(`     - rate.originalBaseCharge: ${rate.originalBaseCharge}`);
    console.log(`     - rate.markup: ${rate.markup}`);
    console.log(`     - rate.subtotal: ${rate.subtotal}`);
    console.log(`     - rate.taxAmount: ${rate.taxAmount}`);
    console.log(`     - rate.baseCharge?.amount: ${rate.baseCharge?.amount}`);
    
    this.cleanExpired();
  }

  cacheMultipleQuotes(rates: any[]): void {
    rates.forEach(rate => this.cacheQuote(rate));
  }

  getQuote(quoteId: string): CachedQuote | null {
    const cached = this.cache.get(quoteId);
    
    if (!cached) {
      console.log(`\n⚠️ CACHE MISS: Quote ${quoteId} not found`);
      console.log(`   Cache size: ${this.cache.size} quotes`);
      console.log(`   Available quote IDs: ${Array.from(this.cache.keys()).slice(0, 10).join(', ')}${this.cache.size > 10 ? '...' : ''}`);
      return null;
    }

    if (new Date() > cached.expiresAt) {
      console.log(`\n⚠️ CACHE EXPIRED: Quote ${quoteId}`);
      console.log(`   Expired at: ${cached.expiresAt.toISOString()}`);
      console.log(`   Created at: ${cached.createdAt.toISOString()}`);
      this.cache.delete(quoteId);
      return null;
    }

    console.log(`\n✅ CACHE HIT: Quote ${quoteId}`);
    console.log(`   ├── Carrier: ${cached.carrierName}`);
    console.log(`   ├── Service: ${cached.serviceName}`);
    console.log(`   ├── Carrier Net: $${cached.carrierNetAmount.toFixed(2)}`);
    console.log(`   ├── Markup: $${cached.markupAmount.toFixed(2)} (${cached.markupPercentage.toFixed(1)}%)`);
    console.log(`   ├── Subtotal: $${cached.subtotal.toFixed(2)}`);
    console.log(`   ├── Tax: $${cached.taxAmount.toFixed(2)}`);
    console.log(`   ├── TOTAL: $${cached.total.toFixed(2)}`);
    console.log(`   ├── Used: ${cached.usedAt ? `YES at ${cached.usedAt.toISOString()}` : 'NO'}`);
    console.log(`   └── Expires: ${cached.expiresAt.toISOString()}`);
    return cached;
  }

  validateQuote(
    quoteId: string,
    clientCarrierNet: number,
    clientTotal: number,
    tolerancePercent: number = 5
  ): { valid: boolean; message: string; serverValues?: CachedQuote } {
    console.log(`\n🔐 VALIDATING QUOTE [${quoteId}]`);
    console.log(`   Client values: carrierNet=$${clientCarrierNet.toFixed(2)}, total=$${clientTotal.toFixed(2)}`);
    
    const cached = this.getQuote(quoteId);

    if (!cached) {
      console.log(`   ❌ VALIDATION FAILED: Quote not in cache`);
      return {
        valid: false,
        message: 'Rate quote not found or expired. Please refresh rates and try again.',
      };
    }

    // IDEMPOTENCY CHECK: Reject if quote was already used
    if (cached.usedAt) {
      console.log(`\n⛔ DUPLICATE BLOCKED: Quote ${quoteId} was already used`);
      console.log(`   Used at: ${cached.usedAt.toISOString()}`);
      console.log(`   Shipment ID: ${cached.usedForShipmentId}`);
      return {
        valid: false,
        message: `This rate quote has already been used to create a shipment. Please get fresh rates and try again.`,
        serverValues: cached,
      };
    }

    const carrierDiff = Math.abs(clientCarrierNet - cached.carrierNetAmount);
    const carrierDiffPercent = cached.carrierNetAmount > 0 
      ? (carrierDiff / cached.carrierNetAmount) * 100 
      : 100;

    console.log(`   Carrier Net comparison:`);
    console.log(`     - Client: $${clientCarrierNet.toFixed(2)}`);
    console.log(`     - Server: $${cached.carrierNetAmount.toFixed(2)}`);
    console.log(`     - Diff: $${carrierDiff.toFixed(2)} (${carrierDiffPercent.toFixed(1)}%)`);

    if (carrierDiffPercent > tolerancePercent) {
      console.log(`   ❌ VALIDATION FAILED: Carrier rate mismatch exceeds ${tolerancePercent}% tolerance`);
      return {
        valid: false,
        message: 'Carrier rate mismatch detected. Please refresh rates and try again.',
        serverValues: cached,
      };
    }

    const totalDiff = Math.abs(clientTotal - cached.total);
    const totalDiffPercent = cached.total > 0 
      ? (totalDiff / cached.total) * 100 
      : 100;

    console.log(`   Total comparison:`);
    console.log(`     - Client: $${clientTotal.toFixed(2)}`);
    console.log(`     - Server: $${cached.total.toFixed(2)}`);
    console.log(`     - Diff: $${totalDiff.toFixed(2)} (${totalDiffPercent.toFixed(1)}%)`);

    if (totalDiffPercent > tolerancePercent) {
      console.log(`   ❌ VALIDATION FAILED: Total price mismatch exceeds ${tolerancePercent}% tolerance`);
      return {
        valid: false,
        message: 'Price mismatch detected. Please refresh rates and try again.',
        serverValues: cached,
      };
    }

    console.log(`   ✅ VALIDATION PASSED`);
    console.log(`   Server authoritative values:`);
    console.log(`     - Carrier Net: $${cached.carrierNetAmount.toFixed(2)}`);
    console.log(`     - Markup: $${cached.markupAmount.toFixed(2)}`);
    console.log(`     - Subtotal: $${cached.subtotal.toFixed(2)}`);
    console.log(`     - Tax: $${cached.taxAmount.toFixed(2)}`);
    console.log(`     - TOTAL TO CHARGE: $${cached.total.toFixed(2)}`);

    return {
      valid: true,
      message: 'Quote validated successfully',
      serverValues: cached,
    };
  }

  /**
   * Mark a quote as consumed after successful shipment creation
   * This prevents the same quote from being used again
   */
  markQuoteAsUsed(quoteId: string, shipmentId: string): boolean {
    const cached = this.cache.get(quoteId);
    
    if (!cached) {
      console.log(`⚠️ Cannot mark quote ${quoteId} as used - not found in cache`);
      return false;
    }

    if (cached.usedAt) {
      console.log(`⚠️ Quote ${quoteId} was already marked as used at ${cached.usedAt.toISOString()}`);
      return false;
    }

    cached.usedAt = new Date();
    cached.usedForShipmentId = shipmentId;
    this.cache.set(quoteId, cached);

    console.log(`✅ Quote ${quoteId} marked as used for shipment ${shipmentId}`);
    return true;
  }

  /**
   * Check if a quote has already been used
   */
  isQuoteUsed(quoteId: string): { used: boolean; shipmentId?: string; usedAt?: Date } {
    const cached = this.cache.get(quoteId);
    
    if (!cached) {
      return { used: false };
    }

    if (cached.usedAt) {
      return {
        used: true,
        shipmentId: cached.usedForShipmentId,
        usedAt: cached.usedAt,
      };
    }

    return { used: false };
  }

  private cleanExpired(): void {
    const now = new Date();
    let cleaned = 0;

    const entries = Array.from(this.cache.entries());
    for (const [quoteId, cached] of entries) {
      if (now > cached.expiresAt) {
        this.cache.delete(quoteId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired rate quotes from cache`);
    }
  }

  getCacheStats(): { size: number; oldestQuote: Date | null } {
    let oldestQuote: Date | null = null;
    
    const values = Array.from(this.cache.values());
    for (const cached of values) {
      if (!oldestQuote || cached.createdAt < oldestQuote) {
        oldestQuote = cached.createdAt;
      }
    }

    return {
      size: this.cache.size,
      oldestQuote,
    };
  }
}

export const rateQuoteCache = new RateQuoteCacheService();
