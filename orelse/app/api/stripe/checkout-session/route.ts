// app/api/stripe/checkout-session/route.ts
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { z } from 'zod';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('*** STRIPE_SECRET_KEY is not set in .env. Stripe functionality will fail. ***');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

const createCheckoutSessionSchema = z.object({
  priceId: z.string().startsWith('price_', { message: "Invalid Price ID." }),
});

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or user ID missing' }, { status: 401 });
    }

    const userId = session.user.id;
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

    const userRecord = await prisma.user.findUnique({ where: { id: userId } }); // Changed to const

    if (!userRecord) {
        return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }

    let stripeCustomerId = userRecord.stripeCustomerId; // This might be null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: session.user.name || undefined,
        metadata: { userId: userId },
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
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
    const cancelUrl = `${appUrl}/my-goals?status=canceled`;

    const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId!, // Assert stripeCustomerId is not null here, as it's created if it was null
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: userId } },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: userId }
    };

    const stripeCheckoutSession = await stripe.checkout.sessions.create(stripeSessionParams);

    if (!stripeCheckoutSession.url) {
        return NextResponse.json({ error: 'Could not create Stripe Checkout session (no URL returned).' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: stripeCheckoutSession.id, checkoutUrl: stripeCheckoutSession.url });

  } catch (error: unknown) {
    console.error('Stripe Checkout session creation error:', error);
    if (typeof error === 'object' && error !== null && 'type' in error && typeof error.type === 'string') {
        const stripeError = error as { type: string; message?: string; code?:string; statusCode?: number };
        if (stripeError.type === 'StripeCardError') {
             return NextResponse.json({ error: `Stripe Card Error: ${stripeError.message || 'Unknown card error'}` }, { status: stripeError.statusCode || 400 });
        }
        return NextResponse.json({ error: stripeError.message || 'A Stripe error occurred.' }, { status: stripeError.statusCode || 500 });
    } else if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while creating the checkout session.' }, { status: 500 });
  }
}