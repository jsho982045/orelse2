// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
// import { ThemeProvider } from 'next-themes'; // Remove this
import Providers from '@/src/components/Providers';
import Navbar from '@/src/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'OrElse: Public Goal Accountability',
  description: 'Achieve your goals with fun, community-enforced consequences. OrElse!',
  themeColor: [ // Only dark theme color needed now
    { media: '(prefers-color-scheme: dark)', color: '#121212' }, // Raycast Black
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${poppins.variable} font-sans`} // Add 'dark' class here, ensure font-sans for Inter default
    >
      <body
        className={`
          min-h-screen font-sans antialiased 
          text-raycast-white /* Default text for dark mode */
          bg-gradient-to-br from-[#1A1A1A] to-[#121212] /* Dark: Raycast Grey Dark to Raycast Black */
        `}
      >
        {/* <ThemeProvider /> component removed */}
        <Providers> {/* This is your NextAuth SessionProvider wrapper */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            {/* Optional Footer
            <footer className="p-4 text-center text-xs text-raycast-grey-light">
              © {new Date().getFullYear()} OrElse. All rights reserved.
            </footer>
            */}
          </div>
        </Providers>
      </body>
    </html>
  );
}