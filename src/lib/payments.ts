// FUTURE: Stripe / Mercado Pago integration
// When implemented:
// 1. User selects a plan on a /pricing page
// 2. Create Stripe Checkout session via Supabase Edge Function
// 3. On success webhook: update subscriptions table + profiles.access_status
// 4. On payment failure: set access_status = 'expired', notify admin + user
// 5. Stripe customer portal for self-service cancellation/upgrade

export const PLANS = {
  monthly: { name: 'Mensal', price_cents: 0, currency: 'BRL' },  // set price when ready
  yearly:  { name: 'Anual',  price_cents: 0, currency: 'BRL' },
}

// Placeholder — call this when payment system is ready
export async function createCheckoutSession(userId: string, plan: string) {
  console.log(`Creating checkout session for user ${userId} with plan ${plan}`);
  throw new Error('Payment system not yet implemented');
}
