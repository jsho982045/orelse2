// src/components/Providers.tsx
'use client'; // This directive marks this as a Client Component

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface Props {
  children: React.ReactNode;
  // session?: any; // Removed: SessionProvider now fetches session internally if not provided
}

export default function Providers({ children }: Props) {
  // The SessionProvider should be rendered as high up as possible in your component tree.
  // It doesn't strictly need the session prop anymore for basic functionality;
  // it can fetch it. However, passing it from a server component in layout.tsx
  // can optimize initial load by avoiding a client-side fetch for the session.
  // For now, we'll keep it simple and let SessionProvider handle fetching.
  return <SessionProvider>{children}</SessionProvider>;
}