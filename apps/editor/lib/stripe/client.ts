import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
})

/**
 * Create a checkout session for subscribing to Pro
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId,
      },
    },
  })

  return session
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get subscription by customer ID
 */
export async function getSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })

  return subscriptions.data[0] || null
}

/**
 * Construct webhook event from payload and signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
