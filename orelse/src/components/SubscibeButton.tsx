// src/components/SubscribeButton.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
// import { Stripe } from 'stripe'; // Remove if Stripe type is not used
import { loadStripe } from '@stripe/stripe-js';

interface SubscribeButtonProps {
  priceId: string;
  currentSubscriptionStatus: string | null | undefined;
  buttonText?: string;
  className?: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function SubscribeButton({ 
  priceId, 
  currentSubscriptionStatus,
  buttonText = "Upgrade to Pro",
  className = ""
}: SubscribeButtonProps) {
  const { data: sessionInfo, status: sessionStatus } = useSession(); // Renamed 'session' to 'sessionInfo' to avoid conflict with Stripe session if any
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (sessionStatus !== 'authenticated' || !sessionInfo?.user) {
      setError("Please sign in to subscribe.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const checkoutSessionResponse = await response.json(); // Renamed to avoid conflict

      if (!response.ok || !checkoutSessionResponse.checkoutUrl) {
        setError(checkoutSessionResponse.error || 'Could not create checkout session.');
        setIsLoading(false);
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        // Use checkoutSessionResponse.sessionId if your API returns it like that
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: checkoutSessionResponse.sessionId, 
        });
        if (stripeError) {
          console.error("Stripe redirection error:", stripeError);
          setError(stripeError.message || "Failed to redirect to Stripe.");
        }
      } else {
        setError("Stripe.js has not loaded yet.");
      }
    } catch (err: unknown) { // Typed err as unknown
      console.error("Subscription initiation error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      // setIsLoading(false); // Usually not reset if redirecting
    }
  };

  const defaultButtonClasses = `
    inline-flex items-center justify-center font-medium 
    px-8 py-3 rounded-[36px] 
    shadow-lg hover:shadow-xl active:shadow-md
    bg-[#C8102E] text-[#E2E8F0] /* text-raycast-white -> direct hex */
    hover:bg-[#B00E28] active:bg-[#9A0C22]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-[#121212] /* ring-offset-raycast-black -> direct hex */
    transition-all duration-200 ease-in-out
    disabled:opacity-70 disabled:cursor-not-allowed
  `;

  if (currentSubscriptionStatus === 'active' || currentSubscriptionStatus === 'trialing') {
    return (
      <div className="text-center p-4 bg-[#121212] rounded-[24px] border border-[#333333]/50 shadow-md">
        <p className="font-semibold text-green-400">🎉 You are subscribed to OrElse Pro!</p>
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