import Stripe from 'stripe';

class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    // Debug logging for key validation
    console.log(`Stripe key type: ${secretKey.startsWith('sk_') ? 'SECRET' : 'PUBLISHABLE'} (${secretKey.substring(0, 7)}...)`);
    
    if (!secretKey.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must be a secret key starting with sk_test_ or sk_live_');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'cad'): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
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
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent confirmation error:', error);
      throw error;
    }
  }

  async createRefund(chargeId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
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
