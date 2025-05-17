// app/api/stripe/checkout-session/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if your authOptions is elsewhere
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { z } from 'zod';

// Ensure STRIPE_SECRET_KEY is set
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('*** STRIPE_SECRET_KEY is not set in .env. Stripe functionality will fail. ***');
  // You might throw an error here during server startup in a real app,
  // but for an API route, we'll log and it will fail at runtime if used.
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { // Added || '' to satisfy TS if key is missing, though it will fail
  apiVersion: '2025-04-30.basil', // Use the required API version
  typescript: true,
});

const createCheckoutSessionSchema = z.object({
  priceId: z.string().startsWith('price_', { message: "Invalid Price ID." }),
  // quantity is typically 1 for a subscription
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required for subscription.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = createCheckoutSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { priceId } = validation.data;

    // Get or create a Stripe Customer ID for the user
    let userRecord = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!userRecord) { // Should not happen if session.user.id is valid
        return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }

    let stripeCustomerId = userRecord.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: session.user.name || undefined,
        metadata: {
          userId: userId, 
        },
      });
      stripeCustomerId = customer.id;
      
      userRecord = await prisma.user.update({ // Re-assign userRecord to get the updated value
        where: { id: userId },
        data: { stripeCustomerId: stripeCustomerId },
      });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        console.error("NEXT_PUBLIC_APP_URL is not set in .env");
        return NextResponse.json({ error: 'Application URL configuration is missing.' }, { status: 500 });
    }

    const successUrl = `${appUrl}/my-goals?stripe_session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = `${appUrl}/my-goals?status=canceled`; // Or a dedicated /subscribe?status=canceled page

    const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
            userId: userId 
        }
        // trial_period_days: 7, // Example: if you want to add a 7-day trial
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { // Add userId to the checkout session metadata too
        userId: userId,
      }
    };

    const stripeCheckoutSession = await stripe.checkout.sessions.create(stripeSessionParams);

    if (!stripeCheckoutSession.url) {
        return NextResponse.json({ error: 'Could not create Stripe Checkout session (no URL returned).' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: stripeCheckoutSession.id, checkoutUrl: stripeCheckoutSession.url });

  } catch (error: any) {
    console.error('Stripe Checkout session creation error:', error);
    // It's good to check the type of error for more specific messages
    if (error.type === 'StripeCardError') {
        return NextResponse.json({ error: `Stripe Card Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'An error occurred while creating the checkout session.' }, { status: 500 });
  }
}