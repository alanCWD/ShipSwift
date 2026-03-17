import { shiptimeService } from './shiptime';
import stallionService from './stallion';
import { rateMarkupService } from './rate-markup';
import { rateQuoteCache } from './rate-quote-cache';

interface AggregatedRateRequest {
  from: any;
  to: any;
  packageDetails: any;
  shipmentType?: 'package' | 'pallet' | 'envelope';
}

interface RateSource {
  name: string;
  enabled: boolean;
  supportsPackages: boolean;
  supportsPallets: boolean;
  supportsEnvelopes: boolean;
}

export class RateAggregatorService {
  private sources: Map<string, RateSource>;

  constructor() {
    this.sources = new Map([
      ['shiptime', { 
        name: 'ShipTime', 
        enabled: true, 
        supportsPackages: true, 
        supportsPallets: true,
        supportsEnvelopes: false  // ShipTime not used for envelopes
      }],
      ['stallion', { 
        name: 'Stallion Express', 
        enabled: true, 
        supportsPackages: true, 
        supportsPallets: false,  // Stallion focuses on parcels
        supportsEnvelopes: true   // Stallion handles envelope shipments
      }],
    ]);
  }

  // Get rates from all enabled sources
  async getRates(
    request: AggregatedRateRequest, 
    storage: any
  ): Promise<any[]> {
    const { from, to, packageDetails, shipmentType = 'package' } = request;
    
    console.log('\n📦 Starting multi-source rate aggregation...');
    console.log(`Shipment type: ${shipmentType}`);

    // Determine which sources support this shipment type
    const applicableSources: string[] = [];
    
    for (const [key, source] of Array.from(this.sources.entries())) {
      if (!source.enabled) {
        console.log(`⏭️  Skipping ${source.name} (disabled)`);
        continue;
      }

      if (shipmentType === 'pallet' && !source.supportsPallets) {
        console.log(`⏭️  Skipping ${source.name} (doesn't support pallets)`);
        continue;
      }

      if (shipmentType === 'package' && !source.supportsPackages) {
        console.log(`⏭️  Skipping ${source.name} (doesn't support packages)`);
        continue;
      }

      if (shipmentType === 'envelope' && !source.supportsEnvelopes) {
        console.log(`⏭️  Skipping ${source.name} (doesn't support envelopes)`);
        continue;
      }

      applicableSources.push(key);
    }

    console.log(`✅ Applicable sources: ${applicableSources.join(', ')}`);

    // Fetch rates from all applicable sources in parallel
    const ratePromises = applicableSources.map(async (sourceKey) => {
      try {
        // Check if source is temporarily suspended before fetching
        if (sourceKey === 'shiptime') {
          const shiptimeEnv = await storage.getSetting('SHIPTIME_ENVIRONMENT') || 'production';
          if (shiptimeEnv === 'suspended') {
            console.log(`⏸️  Skipping ShipTime (temporarily suspended)`);
            return [];
          }
        } else if (sourceKey === 'stallion') {
          const stallionEnv = await storage.getSetting('stallion_environment') || 'production';
          if (stallionEnv === 'suspended') {
            console.log(`⏸️  Skipping Stallion (temporarily suspended)`);
            return [];
          }
        }

        console.log(`\n🔄 Fetching rates from ${this.sources.get(sourceKey)?.name}...`);
        
        if (sourceKey === 'shiptime') {
          return await this.getShipTimeRates(from, to, packageDetails, shipmentType);
        } else if (sourceKey === 'stallion') {
          return await this.getStallionRates(from, to, packageDetails, storage);
        }
        
        return [];
      } catch (error: any) {
        console.error(`❌ Failed to fetch rates from ${sourceKey}:`, error.message);
        // Don't fail the entire request if one source fails
        return [];
      }
    });

    // Wait for all rate requests to complete
    const allResults = await Promise.allSettled(ratePromises);
    
    // Combine all successful results
    let allRates: any[] = [];
    allResults.forEach((result, index) => {
      const sourceKey = applicableSources[index];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        console.log(`✅ ${this.sources.get(sourceKey)?.name}: ${result.value.length} rates`);
        allRates = allRates.concat(result.value);
      } else if (result.status === 'rejected') {
        console.log(`❌ ${this.sources.get(sourceKey)?.name}: Failed`);
      } else {
        console.log(`⚠️  ${this.sources.get(sourceKey)?.name}: 0 rates`);
      }
    });

    console.log(`\n📊 Total rates before deduplication: ${allRates.length}`);

    // Deduplicate rates (same carrier + service from multiple sources)
    const deduplicatedRates = this.deduplicateRates(allRates);
    console.log(`📊 Total rates after deduplication: ${deduplicatedRates.length}`);

    // Extract destination province for accurate tax calculation
    const destinationProvince = to.state || to.province || to.provinceCode;
    console.log(`📍 Destination province for tax calculation: ${destinationProvince || 'not provided'}`);

    // Apply markup and calculate accurate Canadian taxes
    const ratesWithMarkup = await rateMarkupService.applyMarkups(deduplicatedRates, destinationProvince);

    // Tag local delivery rates (Uber Direct) with special flag
    const ratesWithLocalDeliveryFlag = ratesWithMarkup.map((rate: any) => {
      const carrierName = (rate.carrier?.name ?? rate.carrierName ?? '').toLowerCase();
      const isLocalDelivery = carrierName.includes('uber');
      
      if (isLocalDelivery) {
        console.log(`🚗 Tagged ${rate.carrier?.name || rate.carrierName} as local delivery`);
      }
      
      return {
        ...rate,
        isLocalDelivery,
        deliveryType: isLocalDelivery ? 'same-day-local' : 'standard',
      };
    });

    // Cache all rate quotes for server-side validation at shipment time
    rateQuoteCache.cacheMultipleQuotes(ratesWithLocalDeliveryFlag);

    console.log(`✅ Multi-source rate aggregation complete\n`);

    return ratesWithLocalDeliveryFlag;
  }

  // Fetch rates from ShipTime
  private async getShipTimeRates(
    from: any,
    to: any,
    packageDetails: any,
    shipmentType: string
  ): Promise<any[]> {
    const rateRequest = {
      from,
      to,
      packageDetails,
      shipmentType: shipmentType as 'package' | 'pallet',
    };

    const rates = await shiptimeService.getRates(rateRequest);
    
    // Add source identifier
    return rates.map(rate => ({
      ...rate,
      source: 'shiptime',
    }));
  }

  // Fetch rates from Stallion
  private async getStallionRates(
    from: any,
    to: any,
    packageDetails: any,
    storage: any
  ): Promise<any[]> {
    try {
      // Load Stallion credentials
      console.log('📦 Loading Stallion credentials...');
      await stallionService.loadCredentials(storage);

      // Convert to Stallion format
      const stallionRequest = stallionService.convertToStallionRequest(
        from,
        to,
        packageDetails
      );

      // Get rates from Stallion
      const stallionRates = await stallionService.getRates(stallionRequest);

      if (stallionRates.length === 0) {
        console.log('⚠️  Stallion returned 0 rates - check credentials and request data');
        return [];
      }

      // Normalize to standard format
      const normalizedRates = stallionRates.map(rate => {
        const normalized = stallionService.normalizeRate(rate);
        console.log(`  ✅ Normalized: ${normalized.carrier?.name || normalized.carrierName} - ${normalized.service?.name || normalized.serviceName}`);
        return normalized;
      });

      console.log(`✅ Stallion: ${normalizedRates.length} rates normalized successfully`);
      return normalizedRates;
    } catch (error: any) {
      console.error('❌ Stallion rate fetch failed:', error.message);
      // Don't throw - allow graceful degradation
      return [];
    }
  }

  // Deduplicate rates that have the same carrier + service
  private deduplicateRates(rates: any[]): any[] {
    const rateMap = new Map<string, any>();

    rates.forEach(rate => {
      // Handle both nested (ShipTime: carrier.name) and flat (Stallion: carrierName) structures
      const carrierName = rate.carrier?.name ?? rate.carrierName ?? 'Unknown';
      const serviceName = rate.service?.name ?? rate.serviceName ?? 'Unknown';
      const key = `${carrierName}_${serviceName}`;
      
      if (carrierName === 'Unknown' || serviceName === 'Unknown') {
        console.log(`  ⚠️  Rate with unknown carrier/service:`, { carrierName, serviceName, source: rate.source });
      }
      
      if (!rateMap.has(key)) {
        rateMap.set(key, rate);
      } else {
        // If we have duplicate, keep the cheaper one
        const existing = rateMap.get(key);
        const existingTotal = existing.baseCharge?.amount || 0;
        const newTotal = rate.baseCharge?.amount || 0;
        
        if (newTotal < existingTotal) {
          console.log(`  🔄 Replacing ${key}: $${existingTotal/100} → $${newTotal/100} (from ${rate.source})`);
          rateMap.set(key, rate);
        } else {
          console.log(`  ⏭️  Keeping existing ${key}: $${existingTotal/100} < $${newTotal/100}`);
        }
      }
    });

    return Array.from(rateMap.values());
  }

  // Enable/disable a source
  setSourceEnabled(sourceKey: string, enabled: boolean): void {
    const source = this.sources.get(sourceKey);
    if (source) {
      source.enabled = enabled;
      console.log(`${source.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Get source status
  getSourceStatus(): any[] {
    return Array.from(this.sources.entries()).map(([key, source]) => ({
      key,
      ...source,
    }));
  }
}

export default new RateAggregatorService();
