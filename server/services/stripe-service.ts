import Stripe from 'stripe';

class StripeService {
  private stripe?: Stripe;
  private secretKey?: string;
  private environment?: string;

  constructor() {
    console.log('StripeService initialized for dynamic credentials');
  }

  // Clear credentials cache (for testing mode switching)
  async clearCredentials() {
    this.stripe = undefined;
    this.secretKey = undefined;
    this.environment = undefined;
    console.log('Stripe credentials cleared - will reload on next request');
  }

  async loadCredentials(): Promise<boolean> {
    try {
      const { storage } = await import('../storage');
      
      const secretKey = await storage.getSetting('STRIPE_SECRET_KEY');
      const environment = await storage.getSetting('STRIPE_ENVIRONMENT') || 'test';
      
      if (secretKey) {
        this.secretKey = secretKey.trim();
        this.environment = environment;
        
        if (!this.secretKey.startsWith('sk_')) {
          console.error('Invalid Stripe secret key format. Must start with sk_test_ or sk_live_');
          throw new Error('STRIPE_SECRET_KEY must be a secret key starting with sk_test_ or sk_live_');
        }
        
        const keyEnvironment = this.secretKey.includes('_test_') ? 'test' : 'live';
        console.log(`Stripe credentials loaded from database`);
        console.log(`  Key type: SECRET (${this.secretKey.substring(0, 7)}...)`);
        console.log(`  Environment setting: ${this.environment}`);
        console.log(`  Key environment: ${keyEnvironment}`);
        
        this.stripe = new Stripe(this.secretKey, {
          apiVersion: '2025-07-30.basil',
        });
        
        return true;
      }
    } catch (error) {
      console.log('Database settings not available, checking environment variables...');
    }
    
    if (process.env.STRIPE_SECRET_KEY) {
      this.secretKey = process.env.STRIPE_SECRET_KEY.trim();
      this.environment = 'test';
      
      if (!this.secretKey.startsWith('sk_')) {
        console.error('Invalid Stripe secret key format. Must start with sk_test_ or sk_live_');
        throw new Error('STRIPE_SECRET_KEY must be a secret key starting with sk_test_ or sk_live_');
      }
      
      console.log(`Stripe credentials loaded from environment variable (${this.secretKey.substring(0, 7)}...)`);
      
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

  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    this.ensureInitialized();
    try {
      const { storage } = await import('../storage');
      const user = await storage.getUser(userId);
      
      if (user?.stripeCustomerId) {
        const existingCustomer = await this.stripe!.customers.retrieve(user.stripeCustomerId);
        if (existingCustomer && !('deleted' in existingCustomer && existingCustomer.deleted)) {
          return existingCustomer as Stripe.Customer;
        }
      }
      
      const customer = await this.stripe!.customers.create({
        email,
        name: name || undefined,
        metadata: {
          goablp_user_id: userId,
        },
      });
      
      await storage.updateUserStripeCustomerId(userId, customer.id);
      
      return customer;
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      throw error;
    }
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    this.ensureInitialized();
    try {
      const setupIntent = await this.stripe!.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });
      return setupIntent;
    } catch (error) {
      console.error('Stripe setup intent creation error:', error);
      throw error;
    }
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    this.ensureInitialized();
    try {
      const paymentMethods = await this.stripe!.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Stripe list payment methods error:', error);
      throw error;
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    this.ensureInitialized();
    try {
      const detached = await this.stripe!.paymentMethods.detach(paymentMethodId);
      return detached;
    } catch (error) {
      console.error('Stripe delete payment method error:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    this.ensureInitialized();
    try {
      const { storage } = await import('../storage');
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID');
      }
      
      await this.stripe!.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      await storage.updateUserDefaultPaymentMethod(userId, paymentMethodId);
    } catch (error) {
      console.error('Stripe set default payment method error:', error);
      throw error;
    }
  }

  async chargeOffSession(
    customerId: string, 
    paymentMethodId: string, 
    amountCents: number, 
    description: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    this.ensureInitialized();
    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: Math.round(amountCents),
        currency: 'cad',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description,
        metadata,
      });
      
      return paymentIntent;
    } catch (error: any) {
      if (error.code === 'authentication_required') {
        console.log('Overage charge requires authentication - will need customer interaction');
      }
      console.error('Stripe off-session charge error:', error);
      throw error;
    }
  }

  async chargeOverage(
    shipmentId: string,
    userId: string,
    overageAmountCents: number,
    reason: string
  ): Promise<{ success: boolean; chargeId?: string; error?: string }> {
    this.ensureInitialized();
    try {
      const { storage } = await import('../storage');
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId || !user?.defaultPaymentMethodId) {
        return {
          success: false,
          error: 'No saved payment method on file. Please add a card to your account.',
        };
      }
      
      const paymentIntent = await this.chargeOffSession(
        user.stripeCustomerId,
        user.defaultPaymentMethodId,
        overageAmountCents,
        `Shipping overage charge for shipment ${shipmentId}`,
        {
          shipment_id: shipmentId,
          user_id: userId,
          type: 'overage',
        }
      );
      
      if (paymentIntent.status === 'succeeded') {
        await storage.updateShipmentOverage(shipmentId, {
          overageAmount: (overageAmountCents / 100).toFixed(2),
          overageChargeId: paymentIntent.id,
          overageStatus: 'charged',
          overageChargedAt: new Date(),
        });
        
        return {
          success: true,
          chargeId: paymentIntent.id,
        };
      } else {
        await storage.updateShipmentOverage(shipmentId, {
          overageAmount: (overageAmountCents / 100).toFixed(2),
          overageStatus: 'failed',
        });
        
        return {
          success: false,
          error: `Payment not completed. Status: ${paymentIntent.status}`,
        };
      }
    } catch (error: any) {
      console.error('Overage charge failed:', error);
      
      const { storage } = await import('../storage');
      await storage.updateShipmentOverage(shipmentId, {
        overageAmount: (overageAmountCents / 100).toFixed(2),
        overageStatus: 'failed',
      });
      
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  async chargeShipment(
    userId: string,
    amountCents: number,
    shipmentDescription: string,
    metadata?: Record<string, string>
  ): Promise<{ 
    success: boolean; 
    chargeId?: string; 
    error?: string;
    stripeChargeSnapshot?: Record<string, any>;
    customerPaymentSnapshot?: Record<string, any>;
  }> {
    this.ensureInitialized();
    try {
      const { storage } = await import('../storage');
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId || !user?.defaultPaymentMethodId) {
        return {
          success: false,
          error: 'No saved payment method on file. Please add a card to your account.',
        };
      }
      
      const paymentIntent = await this.chargeOffSession(
        user.stripeCustomerId,
        user.defaultPaymentMethodId,
        amountCents,
        shipmentDescription,
        metadata
      );
      
      if (paymentIntent.status === 'succeeded') {
        // Get payment method details for audit snapshot
        let customerPaymentSnapshot: Record<string, any> | undefined;
        try {
          const paymentMethod = await this.stripe!.paymentMethods.retrieve(user.defaultPaymentMethodId);
          if (paymentMethod.card) {
            customerPaymentSnapshot = {
              last4: paymentMethod.card.last4,
              brand: paymentMethod.card.brand,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            };
          }
        } catch (pmError) {
          console.error('Failed to get payment method details for audit:', pmError);
        }

        // Create Stripe charge snapshot for audit
        const stripeChargeSnapshot = {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          amountReceived: paymentIntent.amount_received,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          createdAt: new Date(paymentIntent.created * 1000).toISOString(),
          paymentMethodId: user.defaultPaymentMethodId,
        };

        return {
          success: true,
          chargeId: paymentIntent.id,
          stripeChargeSnapshot,
          customerPaymentSnapshot,
        };
      } else {
        return {
          success: false,
          error: `Payment not completed. Status: ${paymentIntent.status}`,
        };
      }
    } catch (error: any) {
      console.error('Shipment payment charge failed:', error);
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'cad', customerId?: string): Promise<Stripe.PaymentIntent> {
    this.ensureInitialized();
    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        setup_future_usage: customerId ? 'off_session' : undefined,
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

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    this.ensureInitialized();
    try {
      const refund = await this.stripe!.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount) : undefined,
      });

      console.log(`✅ Refund created: ${refund.id} for PaymentIntent ${paymentIntentId}`);
      return refund;
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      throw error;
    }
  }
  
  getEnvironment(): string {
    return this.environment || 'unknown';
  }
}

export const stripeService = new StripeService();
