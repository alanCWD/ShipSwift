import axios from 'axios';

interface PostalCodeResult {
  city: string;
  province: string;
  source: 'google' | 'fsa_map' | 'error';
}

class PostalCodeLookupService {
  private googleApiKey: string | null = null;

  constructor() {
    // Google Maps API key (optional - will use FSA fallback if not provided)
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
    
    if (!this.googleApiKey) {
      console.warn('⚠️  GOOGLE_MAPS_API_KEY not configured - using FSA mapping fallback only');
    }
  }

  /**
   * Lookup city and province from a Canadian postal code
   * Tries Google Geocoding API first, then falls back to FSA mapping
   */
  async lookup(postalCode: string): Promise<PostalCodeResult> {
    // Normalize postal code (remove spaces, uppercase)
    const normalized = postalCode.replace(/\s+/g, '').toUpperCase();
    
    // Validate Canadian postal code format (A1A1A1)
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalized)) {
      console.warn(`⚠️  Invalid postal code format: ${postalCode}`);
      return this.fsaLookup(normalized);
    }

    // Try Google Geocoding first (if API key available)
    if (this.googleApiKey) {
      try {
        const googleResult = await this.googleLookup(normalized);
        if (googleResult) {
          console.log(`✅ Google Geocoding: ${normalized} → ${googleResult.city}, ${googleResult.province}`);
          return googleResult;
        }
      } catch (error: any) {
        console.warn(`⚠️  Google Geocoding failed for ${normalized}:`, error.message);
      }
    }

    // Fallback to FSA mapping
    console.log(`📍 Using FSA mapping fallback for ${normalized}`);
    return this.fsaLookup(normalized);
  }

  /**
   * Google Geocoding API lookup
   */
  private async googleLookup(postalCode: string): Promise<PostalCodeResult | null> {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    // Format postal code with space (A1A 1A1) for better Google results
    const formatted = postalCode.slice(0, 3) + ' ' + postalCode.slice(3);
    
    const params = {
      components: `country:CA|postal_code:${formatted}`,
      key: this.googleApiKey!,
    };

    const response = await axios.get(url, { params, timeout: 5000 });
    const data = response.data;

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`⚠️  Google returned status: ${data.status}`);
      return null;
    }

    // Extract city and province from address_components
    const components = data.results[0].address_components;
    let city: string | null = null;
    let province: string | null = null;

    for (const component of components) {
      // City can be "locality" or "sublocality"
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (!city && component.types.includes('sublocality')) {
        city = component.long_name;
      }
      
      // Province
      if (component.types.includes('administrative_area_level_1')) {
        province = component.short_name; // e.g., "ON", "BC"
      }
    }

    if (!city || !province) {
      console.warn(`⚠️  Google couldn't extract city/province for ${postalCode}`);
      return null;
    }

    return {
      city,
      province,
      source: 'google',
    };
  }

  /**
   * FSA (Forward Sortation Area) mapping fallback
   * Maps 3-character postal code prefixes to cities
   */
  private fsaLookup(postalCode: string): PostalCodeResult {
    const fsa = postalCode.substring(0, 3);
    
    // Comprehensive FSA to city mapping (major Canadian cities)
    const fsaMap: Record<string, { city: string, province: string }> = {
      // Ontario
      'M1A': { city: 'Scarborough', province: 'ON' },
      'M1B': { city: 'Scarborough', province: 'ON' },
      'M1C': { city: 'Scarborough', province: 'ON' },
      'M1E': { city: 'Scarborough', province: 'ON' },
      'M1G': { city: 'Scarborough', province: 'ON' },
      'M1H': { city: 'Scarborough', province: 'ON' },
      'M1J': { city: 'Scarborough', province: 'ON' },
      'M1K': { city: 'Scarborough', province: 'ON' },
      'M1L': { city: 'Scarborough', province: 'ON' },
      'M1M': { city: 'Scarborough', province: 'ON' },
      'M1N': { city: 'Scarborough', province: 'ON' },
      'M1P': { city: 'Scarborough', province: 'ON' },
      'M1R': { city: 'Scarborough', province: 'ON' },
      'M1S': { city: 'Scarborough', province: 'ON' },
      'M1T': { city: 'Scarborough', province: 'ON' },
      'M1V': { city: 'Scarborough', province: 'ON' },
      'M1W': { city: 'Scarborough', province: 'ON' },
      'M1X': { city: 'Scarborough', province: 'ON' },
      'M4A': { city: 'Toronto', province: 'ON' },
      'M4B': { city: 'Toronto', province: 'ON' },
      'M4C': { city: 'Toronto', province: 'ON' },
      'M4E': { city: 'Toronto', province: 'ON' },
      'M4G': { city: 'Toronto', province: 'ON' },
      'M4H': { city: 'Toronto', province: 'ON' },
      'M4J': { city: 'Toronto', province: 'ON' },
      'M4K': { city: 'Toronto', province: 'ON' },
      'M4L': { city: 'Toronto', province: 'ON' },
      'M4M': { city: 'Toronto', province: 'ON' },
      'M4N': { city: 'Toronto', province: 'ON' },
      'M4P': { city: 'Toronto', province: 'ON' },
      'M4R': { city: 'Toronto', province: 'ON' },
      'M4S': { city: 'Toronto', province: 'ON' },
      'M4T': { city: 'Toronto', province: 'ON' },
      'M4V': { city: 'Toronto', province: 'ON' },
      'M4W': { city: 'Toronto', province: 'ON' },
      'M4X': { city: 'Toronto', province: 'ON' },
      'M4Y': { city: 'Toronto', province: 'ON' },
      'M5A': { city: 'Toronto', province: 'ON' },
      'M5B': { city: 'Toronto', province: 'ON' },
      'M5C': { city: 'Toronto', province: 'ON' },
      'M5E': { city: 'Toronto', province: 'ON' },
      'M5G': { city: 'Toronto', province: 'ON' },
      'M5H': { city: 'Toronto', province: 'ON' },
      'M5J': { city: 'Toronto', province: 'ON' },
      'M5K': { city: 'Toronto', province: 'ON' },
      'M5L': { city: 'Toronto', province: 'ON' },
      'M5M': { city: 'Toronto', province: 'ON' },
      'M5N': { city: 'Toronto', province: 'ON' },
      'M5P': { city: 'Toronto', province: 'ON' },
      'M5R': { city: 'Toronto', province: 'ON' },
      'M5S': { city: 'Toronto', province: 'ON' },
      'M5T': { city: 'Toronto', province: 'ON' },
      'M5V': { city: 'Toronto', province: 'ON' },
      'M5W': { city: 'Toronto', province: 'ON' },
      'M5X': { city: 'Toronto', province: 'ON' },
      'M6A': { city: 'Toronto', province: 'ON' },
      'M6B': { city: 'Toronto', province: 'ON' },
      'M6C': { city: 'Toronto', province: 'ON' },
      'M6E': { city: 'Toronto', province: 'ON' },
      'M6G': { city: 'Toronto', province: 'ON' },
      'M6H': { city: 'Toronto', province: 'ON' },
      'M6J': { city: 'Toronto', province: 'ON' },
      'M6K': { city: 'Toronto', province: 'ON' },
      'M6L': { city: 'Toronto', province: 'ON' },
      'M6M': { city: 'Toronto', province: 'ON' },
      'M6N': { city: 'Toronto', province: 'ON' },
      'M6P': { city: 'Toronto', province: 'ON' },
      'M6R': { city: 'Toronto', province: 'ON' },
      'M6S': { city: 'Toronto', province: 'ON' },
      'M7A': { city: 'Toronto', province: 'ON' },
      'M8V': { city: 'Toronto', province: 'ON' },
      'M8W': { city: 'Toronto', province: 'ON' },
      'M8X': { city: 'Toronto', province: 'ON' },
      'M8Y': { city: 'Toronto', province: 'ON' },
      'M8Z': { city: 'Toronto', province: 'ON' },
      'M9A': { city: 'Toronto', province: 'ON' },
      'M9B': { city: 'Toronto', province: 'ON' },
      'M9C': { city: 'Toronto', province: 'ON' },
      'M9L': { city: 'Toronto', province: 'ON' },
      'M9M': { city: 'Toronto', province: 'ON' },
      'M9N': { city: 'Toronto', province: 'ON' },
      'M9P': { city: 'Toronto', province: 'ON' },
      'M9R': { city: 'Toronto', province: 'ON' },
      'M9V': { city: 'Toronto', province: 'ON' },
      'M9W': { city: 'Toronto', province: 'ON' },
      'L4Z': { city: 'Mississauga', province: 'ON' },
      'L5A': { city: 'Mississauga', province: 'ON' },
      'L5B': { city: 'Mississauga', province: 'ON' },
      'L5C': { city: 'Mississauga', province: 'ON' },
      'L5E': { city: 'Mississauga', province: 'ON' },
      'L5G': { city: 'Mississauga', province: 'ON' },
      'L5H': { city: 'Mississauga', province: 'ON' },
      'L5J': { city: 'Mississauga', province: 'ON' },
      'L5K': { city: 'Mississauga', province: 'ON' },
      'L5L': { city: 'Mississauga', province: 'ON' },
      'L5M': { city: 'Mississauga', province: 'ON' },
      'L5N': { city: 'Mississauga', province: 'ON' },
      'L5R': { city: 'Mississauga', province: 'ON' },
      'L5T': { city: 'Mississauga', province: 'ON' },
      'L5V': { city: 'Mississauga', province: 'ON' },
      'L5W': { city: 'Mississauga', province: 'ON' },
      'K1A': { city: 'Ottawa', province: 'ON' },
      'K1B': { city: 'Ottawa', province: 'ON' },
      'K1C': { city: 'Ottawa', province: 'ON' },
      'K1E': { city: 'Ottawa', province: 'ON' },
      'K1G': { city: 'Ottawa', province: 'ON' },
      'K1H': { city: 'Ottawa', province: 'ON' },
      'K1J': { city: 'Ottawa', province: 'ON' },
      'K1K': { city: 'Ottawa', province: 'ON' },
      'K1L': { city: 'Ottawa', province: 'ON' },
      'K1M': { city: 'Ottawa', province: 'ON' },
      'K1N': { city: 'Ottawa', province: 'ON' },
      'K1P': { city: 'Ottawa', province: 'ON' },
      'K1R': { city: 'Ottawa', province: 'ON' },
      'K1S': { city: 'Ottawa', province: 'ON' },
      'K1T': { city: 'Ottawa', province: 'ON' },
      'K1V': { city: 'Ottawa', province: 'ON' },
      'K1W': { city: 'Ottawa', province: 'ON' },
      'K1Y': { city: 'Ottawa', province: 'ON' },
      'K1Z': { city: 'Ottawa', province: 'ON' },
      'K2A': { city: 'Ottawa', province: 'ON' },
      'K2B': { city: 'Ottawa', province: 'ON' },
      'K2C': { city: 'Ottawa', province: 'ON' },
      'K2E': { city: 'Ottawa', province: 'ON' },
      'K2G': { city: 'Ottawa', province: 'ON' },
      'K2H': { city: 'Ottawa', province: 'ON' },
      'K2J': { city: 'Ottawa', province: 'ON' },
      'K2K': { city: 'Ottawa', province: 'ON' },
      'K2L': { city: 'Ottawa', province: 'ON' },
      'K2M': { city: 'Ottawa', province: 'ON' },
      'K2P': { city: 'Ottawa', province: 'ON' },
      'K2R': { city: 'Ottawa', province: 'ON' },
      'K2S': { city: 'Ottawa', province: 'ON' },
      'K2T': { city: 'Ottawa', province: 'ON' },
      'K2V': { city: 'Ottawa', province: 'ON' },
      'K2W': { city: 'Ottawa', province: 'ON' },

      // British Columbia
      'V5A': { city: 'Vancouver', province: 'BC' },
      'V5B': { city: 'Vancouver', province: 'BC' },
      'V5C': { city: 'Vancouver', province: 'BC' },
      'V5E': { city: 'Vancouver', province: 'BC' },
      'V5G': { city: 'Vancouver', province: 'BC' },
      'V5H': { city: 'Vancouver', province: 'BC' },
      'V5J': { city: 'Vancouver', province: 'BC' },
      'V5K': { city: 'Vancouver', province: 'BC' },
      'V5L': { city: 'Vancouver', province: 'BC' },
      'V5M': { city: 'Vancouver', province: 'BC' },
      'V5N': { city: 'Vancouver', province: 'BC' },
      'V5P': { city: 'Vancouver', province: 'BC' },
      'V5R': { city: 'Vancouver', province: 'BC' },
      'V5S': { city: 'Vancouver', province: 'BC' },
      'V5T': { city: 'Vancouver', province: 'BC' },
      'V5V': { city: 'Vancouver', province: 'BC' },
      'V5W': { city: 'Vancouver', province: 'BC' },
      'V5X': { city: 'Vancouver', province: 'BC' },
      'V5Y': { city: 'Vancouver', province: 'BC' },
      'V5Z': { city: 'Vancouver', province: 'BC' },
      'V6A': { city: 'Vancouver', province: 'BC' },
      'V6B': { city: 'Vancouver', province: 'BC' },
      'V6C': { city: 'Vancouver', province: 'BC' },
      'V6E': { city: 'Vancouver', province: 'BC' },
      'V6G': { city: 'Vancouver', province: 'BC' },
      'V6H': { city: 'Vancouver', province: 'BC' },
      'V6J': { city: 'Vancouver', province: 'BC' },
      'V6K': { city: 'Vancouver', province: 'BC' },
      'V6L': { city: 'Vancouver', province: 'BC' },
      'V6M': { city: 'Vancouver', province: 'BC' },
      'V6N': { city: 'Vancouver', province: 'BC' },
      'V6P': { city: 'Vancouver', province: 'BC' },
      'V6R': { city: 'Vancouver', province: 'BC' },
      'V6S': { city: 'Vancouver', province: 'BC' },
      'V6T': { city: 'Vancouver', province: 'BC' },
      'V6Z': { city: 'Vancouver', province: 'BC' },
      'V7A': { city: 'Vancouver', province: 'BC' },
      'V7B': { city: 'Vancouver', province: 'BC' },
      'V7C': { city: 'Vancouver', province: 'BC' },
      'V7E': { city: 'Vancouver', province: 'BC' },
      'V7G': { city: 'Vancouver', province: 'BC' },
      'V7H': { city: 'Vancouver', province: 'BC' },
      'V7J': { city: 'Vancouver', province: 'BC' },
      'V7K': { city: 'Vancouver', province: 'BC' },
      'V7L': { city: 'Vancouver', province: 'BC' },
      'V7M': { city: 'Vancouver', province: 'BC' },
      'V7N': { city: 'Vancouver', province: 'BC' },
      'V7P': { city: 'Vancouver', province: 'BC' },
      'V7R': { city: 'Vancouver', province: 'BC' },
      'V7S': { city: 'Vancouver', province: 'BC' },
      'V7T': { city: 'Vancouver', province: 'BC' },
      'V7V': { city: 'Vancouver', province: 'BC' },
      'V7W': { city: 'Vancouver', province: 'BC' },
      'V7X': { city: 'Vancouver', province: 'BC' },
      'V7Y': { city: 'Vancouver', province: 'BC' },
      'V2R': { city: 'Chilliwack', province: 'BC' },
      'V2P': { city: 'Chilliwack', province: 'BC' },
      'V8V': { city: 'Victoria', province: 'BC' },
      'V8W': { city: 'Victoria', province: 'BC' },
      'V8X': { city: 'Victoria', province: 'BC' },
      'V8Y': { city: 'Victoria', province: 'BC' },
      'V8Z': { city: 'Victoria', province: 'BC' },
      'V9A': { city: 'Victoria', province: 'BC' },
      'V9B': { city: 'Victoria', province: 'BC' },
      'V9C': { city: 'Victoria', province: 'BC' },

      // Alberta
      'T2A': { city: 'Calgary', province: 'AB' },
      'T2B': { city: 'Calgary', province: 'AB' },
      'T2C': { city: 'Calgary', province: 'AB' },
      'T2E': { city: 'Calgary', province: 'AB' },
      'T2G': { city: 'Calgary', province: 'AB' },
      'T2H': { city: 'Calgary', province: 'AB' },
      'T2J': { city: 'Calgary', province: 'AB' },
      'T2K': { city: 'Calgary', province: 'AB' },
      'T2L': { city: 'Calgary', province: 'AB' },
      'T2M': { city: 'Calgary', province: 'AB' },
      'T2N': { city: 'Calgary', province: 'AB' },
      'T2P': { city: 'Calgary', province: 'AB' },
      'T2R': { city: 'Calgary', province: 'AB' },
      'T2S': { city: 'Calgary', province: 'AB' },
      'T2T': { city: 'Calgary', province: 'AB' },
      'T2V': { city: 'Calgary', province: 'AB' },
      'T2W': { city: 'Calgary', province: 'AB' },
      'T2X': { city: 'Calgary', province: 'AB' },
      'T2Y': { city: 'Calgary', province: 'AB' },
      'T2Z': { city: 'Calgary', province: 'AB' },
      'T3A': { city: 'Calgary', province: 'AB' },
      'T3B': { city: 'Calgary', province: 'AB' },
      'T3C': { city: 'Calgary', province: 'AB' },
      'T3E': { city: 'Calgary', province: 'AB' },
      'T3G': { city: 'Calgary', province: 'AB' },
      'T3H': { city: 'Calgary', province: 'AB' },
      'T3J': { city: 'Calgary', province: 'AB' },
      'T3K': { city: 'Calgary', province: 'AB' },
      'T3L': { city: 'Calgary', province: 'AB' },
      'T3M': { city: 'Calgary', province: 'AB' },
      'T3N': { city: 'Calgary', province: 'AB' },
      'T3P': { city: 'Calgary', province: 'AB' },
      'T3R': { city: 'Calgary', province: 'AB' },
      'T3S': { city: 'Calgary', province: 'AB' },
      'T3Z': { city: 'Calgary', province: 'AB' },
      'T5A': { city: 'Edmonton', province: 'AB' },
      'T5B': { city: 'Edmonton', province: 'AB' },
      'T5C': { city: 'Edmonton', province: 'AB' },
      'T5E': { city: 'Edmonton', province: 'AB' },
      'T5G': { city: 'Edmonton', province: 'AB' },
      'T5H': { city: 'Edmonton', province: 'AB' },
      'T5J': { city: 'Edmonton', province: 'AB' },
      'T5K': { city: 'Edmonton', province: 'AB' },
      'T5L': { city: 'Edmonton', province: 'AB' },
      'T5M': { city: 'Edmonton', province: 'AB' },
      'T5N': { city: 'Edmonton', province: 'AB' },
      'T5P': { city: 'Edmonton', province: 'AB' },
      'T5R': { city: 'Edmonton', province: 'AB' },
      'T5S': { city: 'Edmonton', province: 'AB' },
      'T5T': { city: 'Edmonton', province: 'AB' },
      'T5V': { city: 'Edmonton', province: 'AB' },
      'T5W': { city: 'Edmonton', province: 'AB' },
      'T5X': { city: 'Edmonton', province: 'AB' },
      'T5Y': { city: 'Edmonton', province: 'AB' },
      'T5Z': { city: 'Edmonton', province: 'AB' },
      'T6A': { city: 'Edmonton', province: 'AB' },
      'T6B': { city: 'Edmonton', province: 'AB' },
      'T6C': { city: 'Edmonton', province: 'AB' },
      'T6E': { city: 'Edmonton', province: 'AB' },
      'T6G': { city: 'Edmonton', province: 'AB' },
      'T6H': { city: 'Edmonton', province: 'AB' },
      'T6J': { city: 'Edmonton', province: 'AB' },
      'T6K': { city: 'Edmonton', province: 'AB' },
      'T6L': { city: 'Edmonton', province: 'AB' },
      'T6M': { city: 'Edmonton', province: 'AB' },
      'T6N': { city: 'Edmonton', province: 'AB' },
      'T6P': { city: 'Edmonton', province: 'AB' },
      'T6R': { city: 'Edmonton', province: 'AB' },
      'T6S': { city: 'Edmonton', province: 'AB' },
      'T6T': { city: 'Edmonton', province: 'AB' },
      'T6V': { city: 'Edmonton', province: 'AB' },
      'T6W': { city: 'Edmonton', province: 'AB' },
      'T6X': { city: 'Edmonton', province: 'AB' },

      // Quebec
      'H1A': { city: 'Montreal', province: 'QC' },
      'H1B': { city: 'Montreal', province: 'QC' },
      'H1C': { city: 'Montreal', province: 'QC' },
      'H1E': { city: 'Montreal', province: 'QC' },
      'H1G': { city: 'Montreal', province: 'QC' },
      'H1H': { city: 'Montreal', province: 'QC' },
      'H1J': { city: 'Montreal', province: 'QC' },
      'H1K': { city: 'Montreal', province: 'QC' },
      'H1L': { city: 'Montreal', province: 'QC' },
      'H1M': { city: 'Montreal', province: 'QC' },
      'H1N': { city: 'Montreal', province: 'QC' },
      'H1P': { city: 'Montreal', province: 'QC' },
      'H1R': { city: 'Montreal', province: 'QC' },
      'H1S': { city: 'Montreal', province: 'QC' },
      'H1T': { city: 'Montreal', province: 'QC' },
      'H1V': { city: 'Montreal', province: 'QC' },
      'H1W': { city: 'Montreal', province: 'QC' },
      'H1X': { city: 'Montreal', province: 'QC' },
      'H1Y': { city: 'Montreal', province: 'QC' },
      'H1Z': { city: 'Montreal', province: 'QC' },
      'H2A': { city: 'Montreal', province: 'QC' },
      'H2B': { city: 'Montreal', province: 'QC' },
      'H2C': { city: 'Montreal', province: 'QC' },
      'H2E': { city: 'Montreal', province: 'QC' },
      'H2G': { city: 'Montreal', province: 'QC' },
      'H2H': { city: 'Montreal', province: 'QC' },
      'H2J': { city: 'Montreal', province: 'QC' },
      'H2K': { city: 'Montreal', province: 'QC' },
      'H2L': { city: 'Montreal', province: 'QC' },
      'H2M': { city: 'Montreal', province: 'QC' },
      'H2N': { city: 'Montreal', province: 'QC' },
      'H2P': { city: 'Montreal', province: 'QC' },
      'H2R': { city: 'Montreal', province: 'QC' },
      'H2S': { city: 'Montreal', province: 'QC' },
      'H2T': { city: 'Montreal', province: 'QC' },
      'H2V': { city: 'Montreal', province: 'QC' },
      'H2W': { city: 'Montreal', province: 'QC' },
      'H2X': { city: 'Montreal', province: 'QC' },
      'H2Y': { city: 'Montreal', province: 'QC' },
      'H2Z': { city: 'Montreal', province: 'QC' },
      'H3A': { city: 'Montreal', province: 'QC' },
      'H3B': { city: 'Montreal', province: 'QC' },
      'H3C': { city: 'Montreal', province: 'QC' },
      'H3E': { city: 'Montreal', province: 'QC' },
      'H3G': { city: 'Montreal', province: 'QC' },
      'H3H': { city: 'Montreal', province: 'QC' },
      'H3J': { city: 'Montreal', province: 'QC' },
      'H3K': { city: 'Montreal', province: 'QC' },
      'H3L': { city: 'Montreal', province: 'QC' },
      'H3M': { city: 'Montreal', province: 'QC' },
      'H3N': { city: 'Montreal', province: 'QC' },
      'H3P': { city: 'Montreal', province: 'QC' },
      'H3R': { city: 'Montreal', province: 'QC' },
      'H3S': { city: 'Montreal', province: 'QC' },
      'H3T': { city: 'Montreal', province: 'QC' },
      'H3V': { city: 'Montreal', province: 'QC' },
      'H3W': { city: 'Montreal', province: 'QC' },
      'H3X': { city: 'Montreal', province: 'QC' },
      'H3Y': { city: 'Montreal', province: 'QC' },
      'H3Z': { city: 'Montreal', province: 'QC' },
      'H4A': { city: 'Montreal', province: 'QC' },
      'H4B': { city: 'Montreal', province: 'QC' },
      'H4C': { city: 'Montreal', province: 'QC' },
      'H4E': { city: 'Montreal', province: 'QC' },
      'H4G': { city: 'Montreal', province: 'QC' },
      'H4H': { city: 'Montreal', province: 'QC' },
      'H4J': { city: 'Montreal', province: 'QC' },
      'H4K': { city: 'Montreal', province: 'QC' },
      'H4L': { city: 'Montreal', province: 'QC' },
      'H4M': { city: 'Montreal', province: 'QC' },
      'H4N': { city: 'Montreal', province: 'QC' },
      'H4P': { city: 'Montreal', province: 'QC' },
      'H4R': { city: 'Montreal', province: 'QC' },
      'H4S': { city: 'Montreal', province: 'QC' },
      'H4T': { city: 'Montreal', province: 'QC' },
      'H4V': { city: 'Montreal', province: 'QC' },
      'H4W': { city: 'Montreal', province: 'QC' },
      'H4X': { city: 'Montreal', province: 'QC' },
      'H4Y': { city: 'Montreal', province: 'QC' },
      'H4Z': { city: 'Montreal', province: 'QC' },
      'H5A': { city: 'Montreal', province: 'QC' },
      'H5B': { city: 'Montreal', province: 'QC' },
    };

    const result = fsaMap[fsa];
    
    if (result) {
      return {
        ...result,
        source: 'fsa_map',
      };
    }

    // Last resort: return generic city based on province prefix
    // First letter of FSA indicates province:
    // A=NL, B=NS, C=PE, E=NB, G/H/J=QC, K/L/M/N/P=ON, R=MB, S=SK, T=AB, V=BC, X=NU/NT, Y=YT
    const provinceMap: Record<string, { city: string, province: string }> = {
      'A': { city: 'St. John\'s', province: 'NL' },
      'B': { city: 'Halifax', province: 'NS' },
      'C': { city: 'Charlottetown', province: 'PE' },
      'E': { city: 'Moncton', province: 'NB' },
      'G': { city: 'Quebec City', province: 'QC' },
      'H': { city: 'Montreal', province: 'QC' },
      'J': { city: 'Sherbrooke', province: 'QC' },
      'K': { city: 'Ottawa', province: 'ON' },
      'L': { city: 'Toronto', province: 'ON' },
      'M': { city: 'Toronto', province: 'ON' },
      'N': { city: 'Toronto', province: 'ON' },
      'P': { city: 'Thunder Bay', province: 'ON' },
      'R': { city: 'Winnipeg', province: 'MB' },
      'S': { city: 'Regina', province: 'SK' },
      'T': { city: 'Calgary', province: 'AB' },
      'V': { city: 'Vancouver', province: 'BC' },
      'X': { city: 'Whitehorse', province: 'YT' },
      'Y': { city: 'Whitehorse', province: 'YT' },
    };

    const firstLetter = fsa.charAt(0);
    const fallback = provinceMap[firstLetter];

    if (fallback) {
      console.warn(`⚠️  Using province-level fallback for ${postalCode} → ${fallback.city}, ${fallback.province}`);
      return {
        ...fallback,
        source: 'fsa_map',
      };
    }

    // Ultimate fallback
    console.error(`❌ Could not determine city/province for postal code: ${postalCode}`);
    return {
      city: 'Unknown',
      province: 'ON',
      source: 'error',
    };
  }
}

// Export singleton instance
export default new PostalCodeLookupService();
