// src/components/SubscribeButton.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Stripe } from 'stripe'; // For type if needed, though not strictly necessary for just redirecting
import { loadStripe } from '@stripe/stripe-js'; // For redirecting to checkout

interface SubscribeButtonProps {
  priceId: string; // The ID of the Stripe Price object for your subscription
  currentSubscriptionStatus: string | null | undefined; // e.g., "active", "canceled", null
  buttonText?: string;
  className?: string;
}

// Make sure to put your Stripe publishable TEST key in your .env file
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_test_publishable_key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');


export default function SubscribeButton({ 
  priceId, 
  currentSubscriptionStatus,
  buttonText = "Upgrade to Pro",
  className = ""
}: SubscribeButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      // Optionally, redirect to sign-in or show a message
      setError("Please sign in to subscribe.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call your backend to create a checkout session
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const checkoutSession = await response.json();

      if (!response.ok || !checkoutSession.checkoutUrl) {
        setError(checkoutSession.error || 'Could not create checkout session.');
        setIsLoading(false);
        return;
      }

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: checkoutSession.sessionId, // If you return sessionId, use this
        });
        // If `redirectToCheckout` fails due to a browser issue or a problem
        // with the session ID, display the error message.
        if (stripeError) {
          console.error("Stripe redirection error:", stripeError);
          setError(stripeError.message || "Failed to redirect to Stripe.");
        }
        // Note: If redirectToCheckout is successful, the user is navigated away,
        // so code here might not execute immediately unless there's an issue.
      } else {
        setError("Stripe.js has not loaded yet.");
      }
    } catch (err: any) {
      console.error("Subscription initiation error:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      // setIsLoading(false); // isLoading might not reset if user is redirected
    }
  };

  // Determine button state and appearance
  const defaultButtonClasses = `
    inline-flex items-center justify-center font-medium 
    px-8 py-3 rounded-[36px] 
    shadow-lg hover:shadow-xl active:shadow-md
    bg-[#C8102E] text-raycast-white /* Default: Raycast Red for subscribe */
    hover:bg-[#B00E28] active:bg-[#9A0C22]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-raycast-black
    transition-all duration-200 ease-in-out
    disabled:opacity-70 disabled:cursor-not-allowed
  `;

  // Do not show the button if user is already actively subscribed
  // You might want more sophisticated logic here based on different statuses later
  if (currentSubscriptionStatus === 'active' || currentSubscriptionStatus === 'trialing') {
    return (
      <div className="text-center p-4 bg-[#121212] rounded-[24px] border border-[#333333]/50 shadow-md">
        <p className="font-semibold text-green-400">🎉 You are subscribed to OrElse Pro!</p>
        {/* Optionally, add a link to manage subscription (Stripe Customer Portal) here */}
      </div>
    );
  }
  
  if (sessionStatus === 'loading') {
    return <div className={`h-[58px] w-full max-w-xs mx-auto bg-[#1A1A1A] animate-pulse rounded-[36px] ${className}`}></div>;
  }


  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleSubscribe}
        disabled={isLoading || sessionStatus !== 'authenticated'}
        className={defaultButtonClasses}
      >
        {isLoading ? 'Redirecting to payment...' : buttonText}
      </button>
      {sessionStatus !== 'authenticated' && !isLoading && (
        <p className="mt-2 text-xs text-[#9c9da6]/80">Please sign in to subscribe.</p>
      )}
      {error && <p className="mt-2 text-sm text-[#FC8181]">{error}</p>}
    </div>
  );
}