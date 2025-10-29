export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  tokenLimit: number;
  features: string[];
  stripePriceId: string;
}

export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  clientSecret?: string;
  error?: string;
}

export interface BillingHistory {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  description: string;
  createdAt: Date;
}

export class StripeService {
  private plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'usd',
      interval: 'month',
      tokenLimit: 1000,
      features: ['Basic writing agents', 'Story export', 'Community support'],
      stripePriceId: '',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      currency: 'usd',
      interval: 'month',
      tokenLimit: 10000,
      features: ['All writing agents', 'Advanced export formats', 'Priority support', 'Version history'],
      stripePriceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    },
    {
      id: 'team',
      name: 'Team',
      price: 49,
      currency: 'usd',
      interval: 'month',
      tokenLimit: 50000,
      features: ['Everything in Pro', 'Team collaboration', 'Admin dashboard', 'Custom integrations'],
      stripePriceId: 'price_team_monthly', // Replace with actual Stripe price ID
    },
  ];

  private billingHistory: Map<string, BillingHistory[]> = new Map();

  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.find(p => p.id === planId) || null;
  }

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    const plan = this.getPlan(planId);
    if (!plan || plan.id === 'free') {
      return { success: false, error: 'Invalid plan' };
    }

    try {
      // In production, this would call Stripe API
      // const subscription = await stripe.subscriptions.create({...});

      // Mock successful subscription creation
      const subscriptionId = this.generateId();

      // Record billing history
      const history: BillingHistory = {
        id: this.generateId(),
        userId,
        amount: plan.price,
        currency: plan.currency,
        status: 'succeeded',
        description: `${plan.name} subscription`,
        createdAt: new Date(),
      };

      const userHistory = this.billingHistory.get(userId) || [];
      userHistory.push(history);
      this.billingHistory.set(userId, userHistory);

      return {
        success: true,
        subscriptionId,
        clientSecret: 'mock_client_secret_' + subscriptionId,
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // In production: await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return false;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPlanId: string
  ): Promise<PaymentResult> {
    const newPlan = this.getPlan(newPlanId);
    if (!newPlan) {
      return { success: false, error: 'Invalid plan' };
    }

    try {
      // In production: await stripe.subscriptions.update(subscriptionId, { items: [...] });
      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Subscription update failed:', error);
      return { success: false, error: 'Update failed' };
    }
  }

  async processWebhook(webhookData: any): Promise<boolean> {
    try {
      // In production, verify webhook signature and process events
      // This would handle subscription updates, payment failures, etc.
      console.log('Processing webhook:', webhookData);
      return true;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  getBillingHistory(userId: string): BillingHistory[] {
    return this.billingHistory.get(userId) || [];
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<string | null> {
    try {
      // In production: const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
      // return paymentIntent.client_secret;

      // Mock payment intent
      return 'mock_payment_intent_' + this.generateId();
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return null;
    }
  }

  calculateProratedAmount(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    daysRemaining: number
  ): number {
    const currentDailyRate = currentPlan.price / 30; // Assuming monthly billing
    const newDailyRate = newPlan.price / 30;
    const proratedDifference = (newDailyRate - currentDailyRate) * daysRemaining;

    return Math.max(0, proratedDifference); // Don't charge negative amounts
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}