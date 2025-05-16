// src/components/AuthButtons.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  // Handle loading state (optional, but good practice)
  if (status === 'loading') {
    return <div className="w-20 h-10 bg-carolina-grey-light dark:bg-raycast-grey-dark animate-pulse rounded-md" />; // Placeholder
  }

  // Logged-in state
  if (session && session.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            width={32} // Slightly smaller image for navbar
            height={32}
            className="rounded-full" // Use Tailwind for rounding
          />
        )}
        {/* Optionally hide name/ID on small screens if needed */}
        <div className="hidden sm:flex sm:flex-col text-xs">
           <span className="font-medium text-carolina-black dark:text-raycast-white">
             {session.user.name || session.user.email}
           </span>
           {/* Optionally display ID or keep it hidden */}
           {/* <span className="text-carolina-grey-medium dark:text-raycast-grey-light">
             ID: {(session.user as any).id}
           </span> */}
        </div>
        <button
          onClick={() => signOut()}
          // Destructive button styling
          className="bg-destructive-red dark:bg-destructive-red-dark
                     text-white dark:text-raycast-black
                     px-3 py-1.5 rounded-md text-xs font-medium
                     hover:opacity-90 transition-opacity"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Logged-out state
  return (
    <button
      onClick={() => signIn('google')}
      // Primary action button styling
      className="bg-carolina-blue dark:bg-raycast-red
                 text-white dark:text-raycast-white
                 px-4 py-2 rounded-md text-sm font-medium
                 hover:opacity-90 transition-opacity"
    >
      Sign in
    </button>
  );
}
