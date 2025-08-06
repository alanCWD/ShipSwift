import { loadStripe, Stripe } from '@stripe/stripe-js';

// Load Stripe with the publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    console.log('Stripe key check:', publishableKey ? `Found (${publishableKey.substring(0, 7)}...)` : 'Not found');
    
    if (!publishableKey) {
      console.error('Failed to load Stripe');
      return null;
    }
    
    if (!publishableKey.startsWith('pk_')) {
      console.error('Failed to load Stripe');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Stripe configuration options
export const stripeOptions = {
  locale: 'en-CA' as const,
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    },
  ],
};

// Payment element options
export const paymentElementOptions = {
  layout: 'tabs' as const,
  paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
  business: {
    name: 'ABLP Logistics',
  },
  fields: {
    billingDetails: {
      name: 'auto',
      email: 'auto',
      phone: 'auto',
      address: {
        country: 'auto',
        line1: 'auto',
        line2: 'auto',
        city: 'auto',
        state: 'auto',
        postalCode: 'auto',
      },
    },
  },
};

// Currency and formatting utilities
export const formatCurrency = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const convertToStripeAmount = (amount: number, currency: string = 'CAD'): number => {
  // Stripe amounts are in cents for most currencies
  if (['CAD', 'USD', 'EUR', 'GBP'].includes(currency.toUpperCase())) {
    return Math.round(amount * 100);
  }
  // Some currencies like JPY don't use cents
  return Math.round(amount);
};

export const convertFromStripeAmount = (amount: number, currency: string = 'CAD'): number => {
  // Convert from Stripe cents back to dollars
  if (['CAD', 'USD', 'EUR', 'GBP'].includes(currency.toUpperCase())) {
    return amount / 100;
  }
  return amount;
};

// Payment method types supported in Canada
export const supportedPaymentMethods = [
  'card',
  'apple_pay',
  'google_pay',
  'interac', // Canadian Interac payment method
];

// Stripe webhook event types we handle
export const webhookEventTypes = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_method.attached',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const;

export type WebhookEventType = typeof webhookEventTypes[number];

// Error handling utilities
export const getStripeErrorMessage = (error: any): string => {
  if (error?.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect. Please check and try again.';
      case 'expired_card':
        return 'Your card has expired. Please try a different payment method.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      default:
        return error.message || 'Your card was declined. Please try a different payment method.';
    }
  } else if (error?.type === 'validation_error') {
    return 'Please check your payment information and try again.';
  } else if (error?.type === 'api_error') {
    return 'We are experiencing technical difficulties. Please try again later.';
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
};

// Shipping calculation with tax
export const calculateCanadianTax = (subtotal: number, province: string): number => {
  const taxRates: Record<string, { gst: number; pst: number; hst: number }> = {
    'AB': { gst: 0.05, pst: 0, hst: 0 },
    'BC': { gst: 0.05, pst: 0.07, hst: 0 },
    'MB': { gst: 0.05, pst: 0.07, hst: 0 },
    'NB': { gst: 0, pst: 0, hst: 0.15 },
    'NL': { gst: 0, pst: 0, hst: 0.15 },
    'NS': { gst: 0, pst: 0, hst: 0.15 },
    'NT': { gst: 0.05, pst: 0, hst: 0 },
    'NU': { gst: 0.05, pst: 0, hst: 0 },
    'ON': { gst: 0, pst: 0, hst: 0.13 },
    'PE': { gst: 0, pst: 0, hst: 0.15 },
    'QC': { gst: 0.05, pst: 0.09975, hst: 0 },
    'SK': { gst: 0.05, pst: 0.06, hst: 0 },
    'YT': { gst: 0.05, pst: 0, hst: 0 },
  };

  const rates = taxRates[province.toUpperCase()];
  if (!rates) return 0;

  if (rates.hst > 0) {
    return subtotal * rates.hst;
  }
  
  return subtotal * (rates.gst + rates.pst);
};

// Stripe Elements appearance customization for ABLP branding
export const stripeElementsAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#1E40AF', // ABLP blue
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Tab': {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    },
    '.Tab:hover': {
      color: '#1E40AF',
    },
    '.Tab--selected': {
      backgroundColor: '#1E40AF',
      color: '#ffffff',
    },
    '.Input': {
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '12px',
    },
    '.Input:focus': {
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 3px rgba(30, 64, 175, 0.1)',
    },
  },
};
