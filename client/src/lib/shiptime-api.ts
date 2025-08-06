export interface ShipTimeAddress {
  countryCode: string;
  postalCode: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  attention?: string;
  phone?: string;
}

export interface PackageDetails {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface ShipTimeRate {
  rateId: string;
  carrier: { name: string };
  service: { name: string };
  baseCharge: { amount: number };
  surcharges?: Array<{ 
    name?: string;
    price: { amount: number };
  }>;
  taxes?: Array<{ 
    name?: string;
    price: { amount: number };
  }>;
  deliveryDays?: number;
  lineItems?: PackageDetails[];
}

export interface ShipTimeShipment {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  carrier: { name: string };
  service: { name: string };
}

export interface RateRequest {
  fromCountry: string;
  fromPostalCode: string;
  toCountry: string;
  toPostalCode: string;
  packageDetails: PackageDetails;
}

export interface ShipmentRequest {
  rateId: string;
  carrierName: string;
  serviceName: string;
  fromAddress: ShipTimeAddress;
  toAddress: ShipTimeAddress;
  packageDetails: PackageDetails;
}

export class ShipTimeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'ShipTimeAPIError';
  }
}

export const validateCanadianPostalCode = (postalCode: string): boolean => {
  const canadianPostalCodeRegex = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
  return canadianPostalCodeRegex.test(postalCode.replace(/\s/g, ''));
};

export const validateUSZipCode = (zipCode: string): boolean => {
  const usZipCodeRegex = /^\d{5}(-\d{4})?$/;
  return usZipCodeRegex.test(zipCode);
};

export const formatCanadianPostalCode = (postalCode: string): string => {
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return postalCode;
};

export const validatePostalCode = (postalCode: string, countryCode: string): boolean => {
  if (countryCode === 'CA') {
    return validateCanadianPostalCode(postalCode);
  } else if (countryCode === 'US') {
    return validateUSZipCode(postalCode);
  }
  return postalCode.length > 0; // Basic validation for other countries
};

export const calculateRateTotal = (rate: ShipTimeRate): number => {
  let total = 0;
  
  if (rate.baseCharge?.amount) {
    total += rate.baseCharge.amount / 100; // Convert from cents
  }
  
  if (rate.surcharges) {
    rate.surcharges.forEach(surcharge => {
      if (surcharge.price?.amount) {
        total += surcharge.price.amount / 100;
      }
    });
  }
  
  if (rate.taxes) {
    rate.taxes.forEach(tax => {
      if (tax.price?.amount) {
        total += tax.price.amount / 100;
      }
    });
  }
  
  return total;
};

export const getCarrierLogo = (carrierName: string): string => {
  const logoMap: Record<string, string> = {
    'Canada Post': '🇨🇦',
    'Purolator': '📦',
    'UPS': '📦',
    'FedEx': '✈️',
    'DHL': '🌍',
    'Canpar': '🚚',
    'Loomis': '🚛',
    'GLS': '📬',
    'Nationex': '🚚',
  };
  
  return logoMap[carrierName] || '📦';
};

export const getEstimatedDeliveryDate = (deliveryDays?: number): Date | null => {
  if (!deliveryDays) return null;
  
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);
  
  // Skip weekends for business days calculation
  let addedDays = 0;
  while (addedDays < deliveryDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return deliveryDate;
};

// Canadian provinces mapping
export const CANADIAN_PROVINCES = {
  'AB': 'Alberta',
  'BC': 'British Columbia',
  'MB': 'Manitoba',
  'NB': 'New Brunswick',
  'NL': 'Newfoundland and Labrador',
  'NS': 'Nova Scotia',
  'NT': 'Northwest Territories',
  'NU': 'Nunavut',
  'ON': 'Ontario',
  'PE': 'Prince Edward Island',
  'QC': 'Quebec',
  'SK': 'Saskatchewan',
  'YT': 'Yukon',
};

// US states mapping
export const US_STATES = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
};

export const getProvinceOptions = (countryCode: string) => {
  if (countryCode === 'CA') {
    return Object.entries(CANADIAN_PROVINCES).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  } else if (countryCode === 'US') {
    return Object.entries(US_STATES).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  }
  return [];
};
