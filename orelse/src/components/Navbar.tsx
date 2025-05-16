// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import AuthButtons from './AuthButtons';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    // Apply direct background, border, and sticky positioning
    <nav className="bg-[#4A90E2]
                  sticky top-0 z-40">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16"> {/* Fixed height */}

          {/* Site Title/Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              // Apply font, color, and hover styles
              className="font-display text-2xl font-bold
                         text-carolina-blue dark:text-raycast-red
                         hover:opacity-80 transition-opacity"
            >
              OrElse
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggle />
            <AuthButtons />
          </div>

        </div>
      </div>
    </nav>
  );
}
