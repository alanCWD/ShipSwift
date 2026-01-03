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
}

class RateQuoteCacheService {
  private cache: Map<string, CachedQuote> = new Map();
  private readonly QUOTE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  cacheQuote(rate: any): void {
    const quoteId = rate.quoteId || rate.rateId || rate.id;
    if (!quoteId) {
      console.log('⚠️ Cannot cache rate - no quoteId');
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
    };

    this.cache.set(quoteId, cached);
    console.log(`📦 Cached rate quote ${quoteId}: ${carrierName} ${serviceName}`);
    console.log(`   Carrier net: $${carrierNetAmount.toFixed(2)}, Markup: $${markupAmount.toFixed(2)} (${markupPercentage.toFixed(1)}%)`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Total: $${total.toFixed(2)}`);
    
    this.cleanExpired();
  }

  cacheMultipleQuotes(rates: any[]): void {
    rates.forEach(rate => this.cacheQuote(rate));
  }

  getQuote(quoteId: string): CachedQuote | null {
    const cached = this.cache.get(quoteId);
    
    if (!cached) {
      console.log(`⚠️ Quote ${quoteId} not found in cache`);
      return null;
    }

    if (new Date() > cached.expiresAt) {
      console.log(`⚠️ Quote ${quoteId} has expired`);
      this.cache.delete(quoteId);
      return null;
    }

    console.log(`✅ Retrieved cached quote ${quoteId}: $${cached.total.toFixed(2)}`);
    return cached;
  }

  validateQuote(
    quoteId: string,
    clientCarrierNet: number,
    clientTotal: number,
    tolerancePercent: number = 5
  ): { valid: boolean; message: string; serverValues?: CachedQuote } {
    const cached = this.getQuote(quoteId);

    if (!cached) {
      return {
        valid: false,
        message: 'Rate quote not found or expired. Please refresh rates and try again.',
      };
    }

    // IDEMPOTENCY CHECK: Reject if quote was already used
    if (cached.usedAt) {
      console.log(`⛔ DUPLICATE BLOCKED: Quote ${quoteId} was already used at ${cached.usedAt.toISOString()}`);
      console.log(`   Previously created shipment: ${cached.usedForShipmentId}`);
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

    if (carrierDiffPercent > tolerancePercent) {
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

    if (totalDiffPercent > tolerancePercent) {
      return {
        valid: false,
        message: 'Price mismatch detected. Please refresh rates and try again.',
        serverValues: cached,
      };
    }

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
