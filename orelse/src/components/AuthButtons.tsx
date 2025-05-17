// src/components/AuthButtons.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    // Dark theme loading placeholder
    return <div className="w-20 h-10 bg-[#1A1A1A] animate-pulse rounded-md" />; 
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User avatar'}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <div className="hidden sm:flex sm:flex-col text-xs">
           <span className="font-medium text-[#9c9da6]">
             {session.user.name || session.user.email}
           </span>
        </div>
        <button
          onClick={() => signOut()}
          className="
            bg-[#C8102E] /* Destructive Red Dark (lighter red for dark mode destructive) */
            text-raycast-black /* Text on this lighter red */
            px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer
            hover:opacity-90 transition-opacity
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FC8181] focus:ring-offset-raycast-black
          "
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="
        bg-[#C8102E] /* Raycast Red (Primary action) */
        text-raycast-white
        px-4 py-2 rounded-md text-sm font-medium
        hover:opacity-90 transition-opacity
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-raycast-black
      "
    >
      Sign in
    </button>
  );
}