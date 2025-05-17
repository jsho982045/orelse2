// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import AuthButtons from './AuthButtons';
import { useSession } from 'next-auth/react'; // Import useSession

export default function Navbar() {
  const { data: session, status } = useSession(); // Get session status

  const navLinkClasses = "text-sm font-medium text-[#A0AEC0] hover:text-[#E2E8F0] transition-colors px-3 py-2 rounded-md";

  return (
    <nav
      className="
        sticky top-0 z-50 w-full border-b
        bg-[#141414]/80 border-[#333333]/80
        supports-[backdrop-filter]:bg-[#141414]/50
        backdrop-blur-xl shadow-sm
        transition-colors duration-300 ease-in-out
      "
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6"> {/* Added space for potential new links */}
            <Link
              href="/"
              className="font-display text-2xl font-bold transition-opacity hover:opacity-80 text-[#C8102E]"
            >
              OrElse
            </Link>
            {/* Link to Public Goals (Home) - can be optional if logo always goes home */}
            <Link href="/" className={navLinkClasses}>
                Public Goals
            </Link>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {status === 'authenticated' && (
              <Link href="/my-goals" className={navLinkClasses}>
                My Goals
              </Link>
            )}
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}