import Stripe from 'stripe';

class StripeService {
  private stripe?: Stripe;
  private secretKey?: string;
  private environment?: string;

  constructor() {
    console.log('StripeService initialized for dynamic credentials');
  }

  // Load credentials from database settings or environment variables
  async loadCredentials(): Promise<boolean> {
    // First try database settings (priority for admin-configured credentials)
    try {
      const { storage } = await import('../storage');
      
      const secretKey = await storage.getSetting('STRIPE_SECRET_KEY');
      const environment = await storage.getSetting('STRIPE_ENVIRONMENT') || 'test';
      
      if (secretKey) {
        // Trim whitespace to prevent authentication issues
        this.secretKey = secretKey.trim();
        this.environment = environment;
        
        // Validate key format
        if (!this.secretKey.startsWith('sk_')) {
          console.error('Invalid Stripe secret key format. Must start with sk_test_ or sk_live_');
          throw new Error('STRIPE_SECRET_KEY must be a secret key starting with sk_test_ or sk_live_');
        }
        
        // Determine environment from key prefix
        const keyEnvironment = this.secretKey.includes('_test_') ? 'test' : 'live';
        console.log(`Stripe credentials loaded from database`);
        console.log(`  Key type: SECRET (${this.secretKey.substring(0, 7)}...)`);
        console.log(`  Environment setting: ${this.environment}`);
        console.log(`  Key environment: ${keyEnvironment}`);
        
        // Initialize Stripe with loaded credentials
        this.stripe = new Stripe(this.secretKey, {
          apiVersion: '2025-07-30.basil',
        });
        
        return true;
      }
    } catch (error) {
      console.log('Database settings not available, checking environment variables...');
    }
    
    // Fallback to environment variable
    if (process.env.STRIPE_SECRET_KEY) {
      this.secretKey = process.env.STRIPE_SECRET_KEY.trim();
      this.environment = 'test'; // Default to test for env var
      
      if (!this.secretKey.startsWith('sk_')) {
        console.error('Invalid Stripe secret key format. Must start with sk_test_ or sk_live_');
        throw new Error('STRIPE_SECRET_KEY must be a secret key starting with sk_test_ or sk_live_');
      }
      
      console.log(`Stripe credentials loaded from environment variable (${this.secretKey.substring(0, 7)}...)`);
      
      // Initialize Stripe with environment variable
      this.stripe = new Stripe(this.secretKey, {
        apiVersion: '2025-07-30.basil',
      });
      
      return true;
    }
    
    console.warn('Stripe credentials not configured in system settings or environment variables');
    return false;
  }

  private ensureInitialized(): void {
    if (!this.stripe) {
      throw new Error('Stripe not initialized. Call loadCredentials() first.');
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'cad'): Promise<Stripe.PaymentIntent> {
    this.ensureInitialized();
    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    this.ensureInitialized();
    try {
      const paymentIntent = await this.stripe!.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent confirmation error:', error);
      throw error;
    }
  }

  async createRefund(chargeId: string, amount?: number): Promise<Stripe.Refund> {
    this.ensureInitialized();
    try {
      const refund = await this.stripe!.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount) : undefined,
      });

      return refund;
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
